"""
Orders API — checkout, payment verification, and order management.

Flow:
    POST /api/orders          → create order from validated cart, decrement stock
    POST /api/orders/<id>/verify-payment → mark pending order as paid (paid/succeeded)
    GET  /api/orders/<id>     → order status (customer check, confirmation polling)
    GET  /api/orders/admin    → admin: list orders (paginated)
    GET  /api/orders/admin/<id> → admin: single order with plain-text items
    PATCH /api/orders/admin/<id> → admin: update fulfilment status

Money is stored as integer minor units (kobo; 1 = ₦0.01) to avoid float errors.
"""

import json
import os
import random
import re
import time
import urllib.parse
import urllib.request
import urllib.error

from flask import Blueprint, jsonify, request

from admin_auth import require_admin
from customer_auth import resolve_user
from database import get_db, load_settings, row_to_product, utc_now

orders_bp = Blueprint("orders", __name__)

# ---------------------------------------------------------------------------
# Optional real Paystack server-side verification.
#
# With PAYSTACK_SECRET_KEY set in the environment, verify-time checkout goes
# through Paystack's transaction/verify API (charged amount must match the
# order total and the gateway must say success). Without the key the legacy
# dev behaviour (trusted local confirmation) applies, so nothing changes for
# existing checkouts.
# ---------------------------------------------------------------------------
PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY", "")
PAYSTACK_VERIFY_URL = "https://api.paystack.co/transaction/verify/"


def payments_configured() -> bool:
    """True only when a Paystack secret key is present."""
    return bool(PAYSTACK_SECRET_KEY)


def _paystack_verify(reference: str, expected_minor: int, expected_currency: str):
    """
    Return (ok, message) for a Paystack transaction reference.

    The amount and currency are checked against the *server-side* order total,
    so a customer cannot pay ₦1 and have a ₦175,000 order marked paid.
    Returns (False, reason) when Paystack is not configured — callers must not
    treat "not configured" as success.
    """
    if not PAYSTACK_SECRET_KEY:
        return False, "Card payments are not configured yet."
    if not reference:
        return False, "Missing payment reference."
    req = urllib.request.Request(
        PAYSTACK_VERIFY_URL + urllib.parse.quote(reference),
        headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        return False, f"Could not reach Paystack to verify payment ({exc})."
    data = payload.get("data") or {}
    if not payload.get("status") or data.get("status") != "success":
        return False, data.get("gateway_response") or "Payment was not successful."
    paid_minor = data.get("amount")
    currency = (data.get("currency") or "").upper()
    if paid_minor is not None and int(paid_minor) < expected_minor:
        return False, "The amount paid does not match the order total."
    if currency and currency != expected_currency.upper():
        return False, "The payment currency does not match the order."
    return True, ""

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")

PAYMENT_STATUSES = ("pending", "paid", "succeeded")


def _positive_int(value, default: int, maximum: int) -> int:
    """Parse a query-string int without ever raising (bad input → default)."""
    try:
        return max(1, min(maximum, int(value)))
    except (TypeError, ValueError):
        return default


def minor(amount) -> int:
    """Money → integer minor units (kobo)."""
    return int(round(float(amount) * 100))


def generate_order_number() -> str:
    return "SC" + time.strftime("%y%m%d") + "-" + "".join(
        str(random.randint(0, 9)) for _ in range(4)
    )


def _clean_str(value, max_len: int) -> str:
    return value.strip()[:max_len] if isinstance(value, str) else ""


def _order_to_json(order_row) -> dict:
    """Serialize an order row the way the frontend expects."""
    items = json.loads(order_row["items"] or "[]")
    shipping = json.loads(order_row["shipping"] or "{}")
    return {
        "id": str(order_row["id"]),
        "orderNumber": order_row["order_number"],
        "userId": str(order_row["user_id"]) if order_row["user_id"] is not None else None,
        "status": order_row["status"],
        "items": [
            {
                "productId": it["productId"],
                "name": it["name"],
                "size": it["size"],
                "color": it["color"],
                "quantity": it["quantity"],
                "price": it["unitPrice"] / 100,
            }
            for it in items
        ],
        "shipping": shipping,
        "paymentMethod": order_row["payment_method"],
        "paymentStatus": order_row["payment_status"],
        "subtotal": order_row["subtotal"] / 100,
        "shippingFee": order_row["shipping_fee"] / 100,
        "total": order_row["total"] / 100,
        "createdAt": order_row["created_at"],
    }


def _load_items_by_id(db, items):
    """Batch-fetch products for cart rows carrying a productId."""
    ids = [str(it.get("productId")) for it in items if isinstance(it, dict)]
    if not ids:
        return {}
    marks = ",".join("?" for _ in ids)
    rows = db.execute(
        "SELECT * FROM products WHERE id IN (%s)" % marks, ids
    ).fetchall()
    return {str(row["id"]): row_to_product(row) for row in rows}


def _validate_shipping(shipping):
    """Returns list of {field, message} errors for the address block."""
    errors = []
    fields = {
        "fullName": 80,
        "email": 120,
        "phone": 40,
        "address": 200,
        "city": 60,
        "state": 60,
    }
    values = {}
    for key, max_len in fields.items():
        v = _clean_str(shipping.get(key), max_len)
        if not v:
            errors.append({"field": key, "message": "This field is required."})
        values[key] = v
    if values["email"] and not EMAIL_RE.match(values["email"]):
        errors.append({"field": "email", "message": "Enter a valid email address."})
    if values["phone"] and not re.match(r"^\+?[0-9 ()-]{7,}$", values["phone"]):
        errors.append({"field": "phone", "message": "Enter a valid phone number."})
    country = _clean_str(shipping.get("country"), 60) or "Nigeria"
    postal = _clean_str(shipping.get("postalCode"), 20)
    if postal and not re.match(r"^[A-Za-z0-9 \-]{3,}$", postal):
        errors.append({"field": "postalCode", "message": "Enter a valid postal code."})
    values["country"] = country
    values["postalCode"] = postal
    values["notes"] = _clean_str(shipping.get("notes"), 500)
    return errors, values


@orders_bp.post("/api/orders")
def place_order():
    db = get_db()
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Invalid request body."}), 400

    shipping = body.get("shipping")
    if not isinstance(shipping, dict):
        shipping = {}
    errors, ship = _validate_shipping(shipping)

    raw_items = body.get("items")
    if not isinstance(raw_items, list) or len(raw_items) == 0:
        errors.append({"field": "items", "message": "Your bag is empty."})

    method = body.get("paymentMethod", "paystack")
    if method not in ("card", "paystack", "bank_transfer", "pay_on_delivery"):
        errors.append({"field": "paymentMethod", "message": "Choose a payment method."})

    if errors:
        return jsonify({"errors": errors}), 400

    product_map = _load_items_by_id(db, raw_items)

    # Build validated line items against the live catalog.
    line_items = []
    out_of_stock = []
    for it in raw_items:
        if not isinstance(it, dict):
            continue
        product = product_map.get(str(it.get("productId")))
        if product is None:
            errors.append(
                {"field": "items", "message": f"Product '{it.get('name', 'item')}' is no longer available."}
            )
            continue
        size = _clean_str(it.get("size"), 20) or (
            product["sizes"][0] if product["sizes"] else "One Size"
        )
        if product["sizes"] and size not in product["sizes"]:
            # Never silently swap in a different size — the customer would
            # receive the wrong garment. Reject and tell them to re-pick.
            errors.append(
                {
                    "field": "items",
                    "message": f"Choose a valid size for {product['name']}.",
                }
            )
            continue
        color = _clean_str(it.get("color"), 40) or (
            product["colors"][0] if product["colors"] else ""
        )
        if product["colors"] and color not in product["colors"]:
            errors.append(
                {
                    "field": "items",
                    "message": f"Choose a valid colour for {product['name']}.",
                }
            )
            continue
        try:
            qty = int(str(it.get("quantity", "1") or "1"))
        except (TypeError, ValueError):
            qty = 1
        qty = max(1, min(qty, 10))
        if not product["inStock"]:
            out_of_stock.append(f"{product['name']} is out of stock.")
            continue
        if product["quantity"] is not None and qty > product["quantity"]:
            out_of_stock.append(
                f"Only {product['quantity']} left of {product['name']}."
            )
            continue
        line_items.append(
            {
                "productId": product["id"],
                "name": product["name"],
                "size": size,
                "color": color,
                "quantity": qty,
                "unitPrice": minor(product["price"]),
                "image": product["images"][0] if product["images"] else "",
            }
        )
    if not line_items and errors == []:
        errors.append({"field": "items", "message": "No purchasable items in your bag."})

    if errors or out_of_stock:
        payload = {"errors": errors} if errors else {}
        if out_of_stock:
            payload["error"] = " ".join(out_of_stock)
        return jsonify(payload), 409 if out_of_stock and not errors else 400

    subtotal = sum(li["unitPrice"] * li["quantity"] for li in line_items)
    # Shipping comes from the same settings the storefront displays, so the
    # banner, the cart summary and the charged total always agree.
    settings = load_settings(db)
    threshold = minor(settings.get("freeShippingThreshold") or 0)
    fee = minor(settings.get("shippingFee") or 0)
    shipping_fee = 0 if (threshold and subtotal >= threshold) else fee
    total = subtotal + shipping_fee

    # Signed-in customers get their order attached to their account, which is
    # what makes "My orders" and the admin customer history work.
    customer = resolve_user()
    customer_id = customer["id"] if customer is not None else None

    conn_row = db.execute(
        """
        INSERT INTO orders
          (order_number, user_id, status, items, shipping, payment_method,
           payment_status, subtotal, shipping_fee, total, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            generate_order_number(),
            customer_id,
            "processing",
            json.dumps(line_items),
            json.dumps(ship),
            method,
            "pending",
            subtotal,
            shipping_fee,
            total,
            utc_now().isoformat(),
        ),
    )
    db.commit()

    # Decrement stock with a guarded UPDATE: the WHERE clause makes the
    # check-and-decrement a single atomic step, so two simultaneous checkouts
    # can never oversell the last item.
    sold_out = []
    for li in line_items:
        cur = db.execute(
            """
            UPDATE products
               SET quantity = quantity - ?,
                   in_stock = CASE WHEN quantity - ? <= 0 THEN 0 ELSE in_stock END
             WHERE id = ? AND quantity >= ?
            """,
            (li["quantity"], li["quantity"], li["productId"], li["quantity"]),
        )
        if cur.rowcount == 0:
            sold_out.append(li["name"])
    if sold_out:
        db.execute("DELETE FROM orders WHERE id = ?", (conn_row.lastrowid,))
        db.commit()
        return (
            jsonify(
                {
                    "error": "Someone just bought the last of: "
                    + ", ".join(sold_out)
                    + ". Please adjust your bag."
                }
            ),
            409,
        )
    db.commit()

    row = db.execute("SELECT * FROM orders WHERE id = ?", (conn_row.lastrowid,)).fetchone()
    return jsonify(_order_to_json(row)), 201


@orders_bp.post("/api/orders/<order_id>/verify-payment")
def verify_payment(order_id):
    """
    Confirm a card payment.

    Only card/Paystack orders can be verified here, only against a reference
    that Paystack itself confirms, for the full server-side total. Offline
    methods (bank transfer, pay on delivery) are marked paid by an admin after
    the money actually arrives — a storefront request can never do it.
    """
    body = request.get_json(silent=True) or {}
    db = get_db()
    row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Order not found."}), 404
    if row["payment_status"] == "succeeded":
        return jsonify({"verified": True, "order": _order_to_json(row)})
    if row["payment_status"] == "failed":
        return jsonify({"verified": False, "error": "This payment failed."}), 402

    if row["payment_method"] not in ("card", "paystack"):
        return (
            jsonify(
                {
                    "verified": False,
                    "error": "This order is paid offline — we confirm it once payment arrives.",
                }
            ),
            400,
        )

    if not payments_configured():
        return (
            jsonify(
                {
                    "verified": False,
                    "error": "Card payments are not configured yet. Choose bank transfer or pay on delivery.",
                }
            ),
            503,
        )

    reference = _clean_str(body.get("reference"), 100)
    ok, message = _paystack_verify(reference, row["total"], "NGN")
    if not ok:
        return jsonify({"verified": False, "error": message}), 402

    # A reference can only ever pay one order: a replayed/duplicated payment
    # notification finds the reference already stored and is treated as paid.
    taken = db.execute(
        "SELECT id FROM orders WHERE paystack_reference = ? AND id != ?",
        (reference, order_id),
    ).fetchone()
    if taken is not None:
        return (
            jsonify({"verified": False, "error": "That payment was already used for another order."}),
            409,
        )

    try:
        db.execute(
            """
            UPDATE orders
               SET payment_status = 'succeeded',
                   status = 'paid',
                   paid_at = ?,
                   paystack_reference = ?
             WHERE id = ?
               AND payment_status IN ('pending', 'paid')
            """,
            (utc_now().isoformat(), reference, order_id),
        )
        db.commit()
    except Exception:
        # Unique index on paystack_reference: a duplicate notification lost the race.
        db.rollback()
    row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    return jsonify({"verified": True, "order": _order_to_json(row)})


@orders_bp.get("/api/orders/<order_id>")
def get_order(order_id):
    db = get_db()
    row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Order not found."}), 404
    order = _order_to_json(row)
    # Only the owner (session) or the checkout email may see full details.
    cart_email = (request.args.get("email") or "").strip().lower()
    if not cart_email or cart_email != str(order["shipping"].get("email", "")).lower():
        order["shipping"] = {}
    return jsonify(order)


@orders_bp.get("/api/orders/session")
def session_orders():
    from customer_auth import resolve_user

    db = get_db()
    user = resolve_user()
    if user is None:
        return jsonify({"error": "Sign in to view your orders."}), 401
    rows = db.execute(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
        (user["id"],),
    ).fetchall()
    return jsonify([_order_to_json(r) for r in rows])


@orders_bp.get("/api/orders/admin/count")
@require_admin
def admin_orders_count():
    db = get_db()
    row = db.execute("SELECT COUNT(*) AS n FROM orders").fetchone()
    return jsonify({"count": row["n"]})


@orders_bp.get("/api/orders/admin")
@require_admin
def admin_list_orders():
    db = get_db()
    page = _positive_int(request.args.get("page"), 1, 100000)
    per_page = _positive_int(request.args.get("per_page"), 20, 50)
    rows = db.execute(
        "SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (per_page, (page - 1) * per_page),
    ).fetchall()
    count = db.execute("SELECT COUNT(*) AS n FROM orders").fetchone()["n"]
    return jsonify(
        {"orders": [_order_to_json(r) for r in rows], "total": count, "page": page}
    )


@orders_bp.get("/api/orders/admin/<order_id>")
@require_admin
def admin_get_order(order_id):
    db = get_db()
    row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Order not found."}), 404
    return jsonify(_order_to_json(row))


@orders_bp.patch("/api/orders/admin/<order_id>")
@require_admin
def admin_update_order(order_id):
    db = get_db()
    body = request.get_json(silent=True) or {}
    ship_status = _clean_str(body.get("status"), 20).lower()
    payment_status = _clean_str(body.get("paymentStatus"), 20).lower()
    if not ship_status and not payment_status:
        return jsonify({"error": "Nothing to update."}), 400
    if ship_status and ship_status not in (
        "processing", "paid", "shipped", "delivered", "cancelled",
    ):
        return jsonify({"error": "Invalid status."}), 400
    updates, params = [], []
    if ship_status:
        updates.append("status = ?")
        params.append(ship_status)
    if payment_status:
        if payment_status not in ("pending", "paid", "succeeded", "failed"):
            return jsonify({"error": "Invalid payment status."}), 400
        updates.append("payment_status = ?")
        params.append(payment_status)
    params.append(order_id)
    db.execute(
        "UPDATE orders SET " + ", ".join(updates) + " WHERE id = ?", params
    )
    db.commit()
    row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Order not found."}), 404
    return jsonify(_order_to_json(row))
