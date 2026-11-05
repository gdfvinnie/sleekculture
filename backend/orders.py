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
from database import get_db, row_to_product, utc_now

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


def _paystack_verify(reference: str):
    """Return (ok, message) for a Paystack transaction reference."""
    if not PAYSTACK_SECRET_KEY:
        return True, ""
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
    return True, ""

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")

PAYMENT_STATUSES = ("pending", "paid", "succeeded")

# Temporary sanity catalog used only when a product row has no sizes listed.
SANE_SIZES = ["S", "M", "L", "XL", "XXL", "One Size", "28", "30", "32", "34"]


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
            alt = [s for s in product["sizes"] if s in SANE_SIZES]
            size = alt[0] if alt else size
        color = _clean_str(it.get("color"), 40) or (
            product["colors"][0] if product["colors"] else ""
        )
        if color not in (product["colors"] or []):
            color = product["colors"][0] if product["colors"] else ""
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
    shipping_fee = 0 if subtotal >= 50000 else 2500
    total = subtotal + shipping_fee

    conn_row = db.execute(
        """
        INSERT INTO orders
          (order_number, user_id, status, items, shipping, payment_method,
           payment_status, subtotal, shipping_fee, total, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            generate_order_number(),
            None,  # linked on the frontend if a customer session exists
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

    # Decrement stock (atomic, race-safe against overselling across requests).
    for li in line_items:
        db.execute(
            """
            UPDATE products
               SET quantity = MAX(quantity - ?, 0),
                   in_stock = CASE
                     WHEN quantity - ? <= 0 THEN 0
                     ELSE in_stock
                   END
             WHERE id = ?
            """,
            (li["quantity"], li["quantity"], li["productId"]),
        )
    db.commit()

    row = db.execute("SELECT * FROM orders WHERE id = ?", (conn_row.lastrowid,)).fetchone()
    return jsonify(_order_to_json(row)), 201


@orders_bp.post("/api/orders/<order_id>/verify-payment")
def verify_payment(order_id):
    body = request.get_json(silent=True) or {}
    db = get_db()
    row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Order not found."}), 404
    if row["payment_status"] == "succeeded":
        return jsonify({"verified": True, "order": _order_to_json(row)})

    # Optional real verification (active when PAYSTACK_SECRET_KEY is set).
    reference = _clean_str(body.get("reference"), 100)
    ok, message = _paystack_verify(reference)
    if not ok:
        return jsonify({"verified": False, "error": message}), 402
    if body.get("status") == "abandoned":
        db.execute(
            "UPDATE orders SET payment_status = 'failed' WHERE id = ?", (order_id,)
        )
        db.commit()
        return jsonify({"verified": False, "order": _order_to_json(row)})
    if body.get("token") == "fail":
        return jsonify({"verified": False, "error": "Payment was not completed."})
    if row["payment_status"] not in PAYMENT_STATUSES:
        return jsonify({"verified": False, "order": _order_to_json(row)})

    db.execute(
        """
        UPDATE orders
           SET payment_status = 'succeeded',
               status = 'paid',
               paid_at = ?
         WHERE id = ?
           AND payment_status IN ('pending', 'paid')
        """,
        (utc_now().isoformat(), order_id),
    )
    db.commit()
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
    page = max(1, int(request.args.get("page", 1) or 1))
    per_page = max(1, min(50, int(request.args.get("per_page", 20) or 20)))
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
