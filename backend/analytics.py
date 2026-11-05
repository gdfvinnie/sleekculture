"""
Admin analytics, customers, payments, and settings endpoints for the admin panel.

All routes are admin-only (session cookie via admin_auth.require_admin).

- GET  /api/admin/stats            → dashboard KPIs
- GET  /api/admin/customers        → customer list with order counts / totals
- GET  /api/admin/customers/<id>   → one customer + their order history
- GET  /api/admin/orders           → flat order list (payments view reads same data)
- PATCH /api/admin/orders/<id>     → update fulfilment / payment status (incl. refunds)
- GET/PUT /api/admin/settings      → simple store settings (key-value)
- POST /api/admin/change-password  → change the signed-in admin's password

Money is stored as integer minor units (kobo), same as orders.py.
"""

import json
import re

from flask import Blueprint, jsonify, request

from admin_auth import require_admin
from database import get_db, hash_password, verify_password

analytics_bp = Blueprint("analytics", __name__)

# Fulfilment statuses the panel lets an admin set.
ORDER_STATUSES = ("processing", "paid", "shipped", "delivered", "cancelled")
PAYMENT_STATUSES = ("pending", "paid", "succeeded", "failed", "refunded")


def _order_to_json(row) -> dict:
    items = json.loads(row["items"] or "[]")
    shipping = json.loads(row["shipping"] or "{}")
    email = shipping.get("email") or ""
    name = shipping.get("fullName") or ""
    return {
        "id": str(row["id"]),
        "orderNumber": row["order_number"],
        "userId": row["user_id"],
        "customerName": name,
        "customerEmail": email,
        "status": row["status"],
        "paymentMethod": row["payment_method"],
        "paymentStatus": row["payment_status"],
        "itemCount": sum(i.get("quantity", 0) for i in items),
        "itemsSummary": ", ".join(f"{i.get('name', '?')} x{i.get('quantity', 1)}" for i in items[:3]),
        "shipping": shipping,
        "total": row["total"] / 100,
        "createdAt": row["created_at"],
    }


def _parse_date(value):
    """Best-effort ISO date parse for ordering/aggregation (UTC 'Z' handled)."""
    from datetime import datetime

    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------- Defaults

DEFAULT_SETTINGS = {
    "storeName": "sleekculture",
    "supportEmail": "jnrvinnie@gmail.com",
    "supportPhone": "+234 8169282171",
    "freeShippingThreshold": 150,
    "shippingFee": 25,
}


def _load_settings(db) -> dict:
    rows = db.execute("SELECT key, value FROM admin_settings").fetchall()
    stored = {r["key"]: r["value"] for r in rows}
    out = dict(DEFAULT_SETTINGS)
    for k in out:
        if k in stored:
            try:
                out[k] = json.loads(stored[k])
            except (ValueError, TypeError):
                out[k] = stored[k]
    return out


# ---------------------------------------------------------------- Dashboard

@analytics_bp.get("/api/admin/stats")
@require_admin
def admin_stats():
    db = get_db()

    # Sales: any order whose payment is effectively cleared.
    sales_row = db.execute(
        """
        SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS total
          FROM orders
         WHERE payment_status IN ('paid', 'succeeded')
        """
    ).fetchone()

    orders_row = db.execute(
        "SELECT COUNT(*) AS n FROM orders"
    ).fetchone()

    pending_row = db.execute(
        """
        SELECT COUNT(*) AS n
          FROM orders
         WHERE status = 'processing'
            OR payment_status IN ('pending', 'failed')
        """
    ).fetchone()

    refunded_row = db.execute(
        """
        SELECT COUNT(*) AS n
          FROM orders
         WHERE payment_status = 'refunded'
        """
    ).fetchone()

    customers_row = db.execute("SELECT COUNT(*) AS n FROM users").fetchone()
    products_row = db.execute("SELECT COUNT(*) AS n FROM products").fetchone()

    recent = db.execute(
        "SELECT * FROM orders ORDER BY created_at DESC LIMIT 8"
    ).fetchall()

    return jsonify(
        {
            "totalSales": sales_row["total"] / 100,
            "totalOrders": orders_row["n"],
            "pendingOrders": pending_row["n"],
            "refundedOrders": refunded_row["n"],
            "customers": customers_row["n"],
            "products": products_row["n"],
            "recentOrders": [_order_to_json(r) for r in recent],
        }
    )


# ---------------------------------------------------------------- Customers

@analytics_bp.get("/api/admin/customers")
@require_admin
def admin_customers():
    db = get_db()
    rows = db.execute(
        """
        SELECT u.id, u.email, u.name, u.created_at,
               COUNT(o.id) AS order_count,
               COALESCE(SUM(
                 CASE WHEN o.payment_status IN ('paid', 'succeeded')
                      THEN o.total ELSE 0 END
               ), 0) AS spend
          FROM users u
          LEFT JOIN orders o ON o.user_id = u.id
         GROUP BY u.id
         ORDER BY spend DESC, u.id ASC
        """
    ).fetchall()
    customers = []
    for r in rows:
        customers.append(
            {
                "id": str(r["id"]),
                "name": r["name"] or "",
                "email": r["email"],
                "memberSince": r["created_at"],
                "orderCount": r["order_count"],
                "totalSpend": r["spend"] / 100,
            }
        )

    # Customers discovered from guest checkouts (email on the order, no account).
    guest = db.execute(
        """
        SELECT LOWER(json_extract(shipping, '$.email')) AS email,
               COUNT(*) AS order_count,
               COALESCE(SUM(CASE
                   WHEN payment_status IN ('paid', 'succeeded') THEN total
                   ELSE 0
               END), 0) AS spend
          FROM orders
         WHERE user_id IS NULL
         GROUP BY LOWER(json_extract(shipping, '$.email'))
        """
    ).fetchall()
    known = {c["email"] for c in customers}
    order_no = len(customers) + 1
    for g in guest:
        if not g["email"] or g["email"] in known:
            continue
        first = db.execute(
            """
            SELECT shipping, created_at FROM orders
             WHERE user_id IS NULL
               AND json_extract(shipping, '$.email') = ?
             LIMIT 1
            """,
            (g["email"],),
        ).fetchone()
        name = ""
        if first is not None:
            name = (json.loads(first["shipping"] or "{}").get("fullName") or "")
        customers.append(
            {
                "id": f"guest-{order_no}",
                "name": name,
                "email": g["email"],
                "memberSince": first["created_at"] if first else None,
                "orderCount": g["order_count"],
                "totalSpend": g["spend"] / 100,
            }
        )
        order_no += 1

    return jsonify(customers)


@analytics_bp.get("/api/admin/customers/<customer_id>")
@require_admin
def admin_customer_detail(customer_id):
    from orders import _order_to_json  # reuse the richer serializer

    db = get_db()
    if customer_id.startswith("guest-"):
        return jsonify({"error": "Guest customer."}), 404
    try:
        int(customer_id)
    except ValueError:
        return jsonify({"error": "Invalid customer id."}), 400

    user = db.execute(
        "SELECT id, email, name, created_at FROM users WHERE id = ?", (customer_id,)
    ).fetchone()
    if user is None:
        return jsonify({"error": "Customer not found."}), 404

    orders = db.execute(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
        (customer_id,),
    ).fetchall()
    return jsonify(
        {
            "id": str(user["id"]),
            "name": user["name"] or "",
            "email": user["email"],
            "memberSince": user["created_at"],
            "orderCount": len(orders),
            "totalSpend": sum(
                o["total"] for o in orders if o["payment_status"] in ("paid", "succeeded")
            ) / 100,
            "orders": [_order_to_json(o) for o in orders],
        }
    )


# ---------------------------------------------------------------- Orders / payments

@analytics_bp.get("/api/admin/orders")
@require_admin
def admin_orders():
    db = get_db()
    rows = db.execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()
    return jsonify([_order_to_json(r) for r in rows])


@analytics_bp.patch("/api/admin/orders/<order_id>")
@require_admin
def admin_update_order(order_id):
    db = get_db()
    body = request.get_json(silent=True) or {}
    status = (body.get("status") or "").strip().lower()
    payment_status = (body.get("paymentStatus") or "").strip().lower()

    if not status and not payment_status:
        return jsonify({"error": "Nothing to update."}), 400
    if status and status not in ORDER_STATUSES:
        return jsonify({"error": "Invalid status."}), 400
    if payment_status and payment_status not in PAYMENT_STATUSES:
        return jsonify({"error": "Invalid payment status."}), 400

    updates, params = [], []
    if status:
        updates.append("status = ?")
        params.append(status)
    if payment_status:
        updates.append("payment_status = ?")
        params.append(payment_status)
        # A cleared payment moves the fulfilment forward too (unless refunded).
        if payment_status in ("paid", "succeeded") and body.get("syncStatus", True):
            shipped = db.execute(
                "SELECT status FROM orders WHERE id = ?", (order_id,)
            ).fetchone()
            if shipped and shipped["status"] == "processing":
                updates.append("status = 'paid'")
    params.append(order_id)
    db.execute("UPDATE orders SET " + ", ".join(updates) + " WHERE id = ?", params)
    db.commit()
    row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Order not found."}), 404
    return jsonify(_order_to_json(row))


# ---------------------------------------------------------------- Settings

@analytics_bp.get("/api/admin/settings")
@require_admin
def admin_get_settings():
    db = get_db()
    return jsonify(_load_settings(db))


@analytics_bp.put("/api/admin/settings")
@require_admin
def admin_put_settings():
    db = get_db()
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return jsonify({"error": "Invalid body."}), 400

    clean = {}
    email = (body.get("supportEmail") or "").strip().lower()
    if email and not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$", email):
        return jsonify({"error": "Support email is not valid."}), 400

    for key in DEFAULT_SETTINGS:
        if key not in body:
            continue
        val = body[key]
        if key == "storeName":
            val = str(val).strip()[:60]
            if not val:
                return jsonify({"error": "Store name cannot be empty."}), 400
        elif key == "supportEmail":
            val = val
        elif key == "supportPhone":
            val = str(val).strip()[:40]
        elif key in ("freeShippingThreshold", "shippingFee"):
            try:
                f = float(val)
            except (TypeError, ValueError):
                return jsonify({"error": f"{key} must be a number."}), 400
            if f < 0:
                return jsonify({"error": f"{key} cannot be negative."}), 400
            val = round(f, 2)
        clean[key] = val

    for key, val in clean.items():
        db.execute(
            """
            INSERT INTO admin_settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (key, json.dumps(val)),
        )
    db.commit()
    return jsonify(_load_settings(db))


# ---------------------------------------------------------------- Admin password

@analytics_bp.post("/api/admin/change-password")
@require_admin
def admin_change_password():
    body = request.get_json(silent=True) or {}
    current = body.get("currentPassword") or ""
    new = body.get("newPassword") or ""
    if not isinstance(current, str) or not isinstance(new, str) or len(new) < 8:
        return jsonify({"error": "New password must be at least 8 characters."}), 400

    db = get_db()

    row = db.execute(
        "SELECT id, password_hash FROM admin_users WHERE id = ?", (request.admin["id"],)
    ).fetchone()
    if row is None or not verify_password(current, row["password_hash"]):
        return jsonify({"error": "Current password is incorrect."}), 401

    db.execute(
        "UPDATE admin_users SET password_hash = ? WHERE id = ?",
        (hash_password(new), row["id"]),
    )
    db.commit()
    return jsonify({"ok": True})
