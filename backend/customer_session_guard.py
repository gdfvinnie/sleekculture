"""
POST /api/orders/<id>/attach — associates the signed-in customer with an
order placed while logged in. Optional but keeps /api/orders/session useful.
"""

from flask import Blueprint, jsonify, request

from customer_auth import resolve_user
from database import get_db

attach_bp = Blueprint("attach", __name__)


@attach_bp.post("/api/orders/<order_id>/attach")
def attach_customer_to_order(order_id):
    db = get_db()
    user = resolve_user()
    if user is None:
        return jsonify({"error": "Not signed in."}), 401
    row = db.execute("SELECT id, user_id FROM orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Order not found."}), 404
    if row["user_id"] is not None:
        return jsonify({"ok": True})
    db.execute(
        "UPDATE orders SET user_id = ? WHERE id = ? AND user_id IS NULL",
        (user["id"], order_id),
    )
    db.commit()
    return jsonify({"ok": True})
