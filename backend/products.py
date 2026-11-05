"""
Products API.

- GET endpoints are public (the storefront catalog).
- POST / PUT / DELETE are admin-only, validated exactly like the original
  backend so the admin form shows the same field errors.
"""

import json

from flask import Blueprint, jsonify, request

from database import get_db, row_to_product
from admin_auth import require_admin

products_bp = Blueprint("products", __name__)


# ----------------------------------------------------------------------
# Validation — mirrors the original rules and messages field by field.
# ----------------------------------------------------------------------

def _as_str(value) -> str:
    return value.strip() if isinstance(value, str) else ""


def _as_number(value):
    """JS-style Number() for the cases the frontend actually sends."""
    if value is None or isinstance(value, bool):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def validate_product_body(body: dict):
    """Returns (errors, values). When errors is non-empty, values is None."""
    errors = []

    name = _as_str(body.get("name"))
    if len(name) < 2:
        errors.append({"field": "name", "message": "Product name must be at least 2 characters."})
    if len(name) > 200:
        errors.append({"field": "name", "message": "Product name is too long."})

    price = _as_number(body.get("price"))
    if price is None or price < 0:
        errors.append(
            {"field": "price", "message": "Price must be a valid non-negative number."}
        )

    original_price = None
    raw_original = body.get("originalPrice")
    if raw_original is not None and raw_original != "":
        original_price = _as_number(raw_original)
        if original_price is None or original_price < 0:
            errors.append(
                {
                    "field": "originalPrice",
                    "message": "Original price must be a valid non-negative number.",
                }
            )

    quantity_raw = body.get("quantity")
    if quantity_raw is None:
        quantity_raw = 0
    quantity = _as_number(quantity_raw)
    if quantity is None or quantity < 0 or not quantity.is_integer():
        errors.append(
            {"field": "quantity", "message": "Quantity must be a non-negative integer."}
        )
    else:
        quantity = int(quantity)

    images = body.get("images")
    if isinstance(images, list):
        images = [i for i in images if isinstance(i, str) and i.strip() != ""]
    else:
        images = None
    if not images:
        errors.append({"field": "images", "message": "Add at least one product image."})
    elif len(images) > 8:
        errors.append({"field": "images", "message": "Maximum 8 images per product."})

    sizes = body.get("sizes")
    if isinstance(sizes, list):
        sizes = [s for s in sizes if isinstance(s, str) and s.strip() != ""]
    else:
        sizes = None
    if not sizes:
        errors.append({"field": "sizes", "message": "Add at least one size."})

    colors = body.get("colors")
    if isinstance(colors, list):
        colors = [c for c in colors if isinstance(c, str) and c.strip() != ""]
    else:
        colors = None
    if not colors:
        errors.append({"field": "colors", "message": "Add at least one color."})

    if errors:
        return errors, None

    values = {
        "name": name,
        "price": price,
        "originalPrice": original_price,
        "category": _as_str(body.get("category")) or "Hoodies",
        "subcategory": _as_str(body.get("subcategory")),
        "quantity": quantity,
        "inStock": 1 if body.get("inStock") else 0,
        "isNew": 1 if body.get("isNew") else 0,
        "isTrending": 1 if body.get("isTrending") else 0,
        "sizes": json_dumps(sizes),
        "colors": json_dumps(colors),
        "images": json_dumps(images),
        "description": (_as_str(body.get("description")) if isinstance(body.get("description"), str) else "")[:5000],
    }
    return [], values


def json_dumps(value) -> str:
    return json.dumps(value)


# ----------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------

@products_bp.get("/api/products")
def list_products():
    db = get_db()
    rows = db.execute("SELECT * FROM products ORDER BY id DESC").fetchall()
    return jsonify([row_to_product(row) for row in rows])


@products_bp.get("/api/products/<product_id>")
def get_product(product_id):
    db = get_db()
    row = db.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Product not found."}), 404
    return jsonify(row_to_product(row))


@products_bp.post("/api/products")
@require_admin
def create_product():
    errors, values = validate_product_body(request.get_json(silent=True) or {})
    if errors:
        return jsonify({"errors": errors}), 400

    db = get_db()
    cursor = db.execute(
        """
        INSERT INTO products
          (name, price, original_price, category, subcategory, quantity,
           in_stock, is_new, is_trending, sizes, colors, images, description)
        VALUES
          (:name, :price, :originalPrice, :category, :subcategory, :quantity,
           :inStock, :isNew, :isTrending, :sizes, :colors, :images, :description)
        """,
        values,
    )
    db.commit()
    row = db.execute("SELECT * FROM products WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return jsonify(row_to_product(row)), 201


@products_bp.put("/api/products/<product_id>")
@require_admin
def update_product(product_id):
    db = get_db()
    existing = db.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone()
    if existing is None:
        return jsonify({"error": "Product not found."}), 404

    errors, values = validate_product_body(request.get_json(silent=True) or {})
    if errors:
        return jsonify({"errors": errors}), 400

    values["id"] = product_id
    db.execute(
        """
        UPDATE products SET
          name = :name, price = :price, original_price = :originalPrice,
          category = :category, subcategory = :subcategory, quantity = :quantity,
          in_stock = :inStock, is_new = :isNew, is_trending = :isTrending,
          sizes = :sizes, colors = :colors, images = :images, description = :description
        WHERE id = :id
        """,
        values,
    )
    db.commit()
    row = db.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    return jsonify(row_to_product(row))


@products_bp.delete("/api/products/<product_id>")
@require_admin
def delete_product(product_id):
    db = get_db()
    cursor = db.execute("DELETE FROM products WHERE id = ?", (product_id,))
    db.commit()
    if cursor.rowcount == 0:
        return jsonify({"error": "Product not found."}), 404
    return jsonify({"ok": True})
