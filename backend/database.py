"""
Database layer for the sleekculture backend.

Uses Python's built-in sqlite3 module. The database file lives in the
project's data/ directory (shared with uploaded images), so all existing
products, users, and sessions carry over untouched.
"""

import json
import os
import sqlite3
from datetime import datetime, timezone

import bcrypt
from flask import g

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# Where the database and uploaded images live (override with DATA_DIR).
DATA_DIR = os.environ.get("DATA_DIR") or os.path.join(PROJECT_ROOT, "data")
DATA_DIR = os.path.abspath(DATA_DIR)
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
DB_PATH = os.path.join(DATA_DIR, "sleekculture.db")

os.makedirs(UPLOADS_DIR, exist_ok=True)


def get_db():
    """One sqlite connection per request (thread-safe with Flask)."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode = WAL")
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(_exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# ----------------------------------------------------------------------
# Schema — identical to the original backend, so the same file works.
# ----------------------------------------------------------------------

SCHEMA = """
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    admin_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    items TEXT NOT NULL DEFAULT '[]',
    shipping TEXT NOT NULL DEFAULT '{}',
    payment_method TEXT NOT NULL DEFAULT 'paystack',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    subtotal INTEGER NOT NULL DEFAULT 0,
    shipping_fee INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    paid_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    original_price REAL CHECK (original_price IS NULL OR original_price >= 0),
    category TEXT NOT NULL,
    subcategory TEXT,
    sizes TEXT NOT NULL DEFAULT '[]',
    colors TEXT NOT NULL DEFAULT '[]',
    images TEXT NOT NULL DEFAULT '[]',
    description TEXT NOT NULL DEFAULT '',
    rating REAL NOT NULL DEFAULT 0,
    reviews INTEGER NOT NULL DEFAULT 0,
    is_new INTEGER NOT NULL DEFAULT 0,
    is_trending INTEGER NOT NULL DEFAULT 0,
    in_stock INTEGER NOT NULL DEFAULT 1,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
"""


def hash_password(password: str) -> str:
    """bcrypt hash (cost 12). Existing hashes from the old backend verify fine."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except (ValueError, UnicodeEncodeError):
        return False


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def init_db():
    """Create tables and seed initial data on first boot only."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.executescript(SCHEMA)

    # --- Seed the initial admin account from environment variables. ---
    email = (os.environ.get("ADMIN_EMAIL") or "jnrvinnie@gmail.com").lower()
    password = os.environ.get("ADMIN_PASSWORD") or "Vinnievinnie11"
    exists = conn.execute("SELECT id FROM admin_users WHERE email = ?", (email,)).fetchone()
    if not exists:
        conn.execute(
            "INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, 'admin')",
            (email, hash_password(password)),
        )
        print(f"[db] seeded admin user: {email}")

    # --- Seed the catalog on first run only. ---
    count = conn.execute("SELECT COUNT(*) AS n FROM products").fetchone()["n"]
    if count == 0:
        with open(os.path.join(BASE_DIR, "fallback_products.json"), encoding="utf-8") as f:
            fallback = json.load(f)
        rows = [
            (
                p["name"],
                p["price"],
                p.get("originalPrice"),
                p["category"],
                p.get("subcategory", ""),
                json.dumps(p["sizes"]),
                json.dumps(p["colors"]),
                json.dumps(p["images"]),
                p["description"],
                p.get("rating", 0),
                p.get("reviews", 0),
                1 if p.get("isNew") else 0,
                1 if p.get("isTrending") else 0,
                1 if p.get("inStock") else 0,
                p.get("quantity", 0),
            )
            for p in fallback
        ]
        conn.executemany(
            """
            INSERT INTO products
              (name, price, original_price, category, subcategory, sizes, colors,
               images, description, rating, reviews, is_new, is_trending,
               in_stock, quantity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )
        print(f"[db] seeded {len(rows)} products")

    conn.commit()
    conn.close()
    print("[db] database ready")


# ----------------------------------------------------------------------
# Row mapping — produces exactly the JSON the frontend expects.
# ----------------------------------------------------------------------

def row_to_product(row) -> dict:
    product = {
        "id": str(row["id"]),
        "name": row["name"],
        "price": float(row["price"]),
        "category": row["category"],
        "subcategory": row["subcategory"] if row["subcategory"] is not None else "",
        "sizes": json.loads(row["sizes"] or "[]"),
        "colors": json.loads(row["colors"] or "[]"),
        "images": json.loads(row["images"] or "[]"),
        "description": row["description"] if row["description"] is not None else "",
        "rating": float(row["rating"] if row["rating"] is not None else 0),
        "reviews": int(row["reviews"] if row["reviews"] is not None else 0),
        "isNew": bool(row["is_new"]),
        "isTrending": bool(row["is_trending"]),
        "inStock": bool(row["in_stock"]),
        "quantity": int(row["quantity"] if row["quantity"] is not None else 0),
    }
    if row["original_price"] is not None:
        product["originalPrice"] = float(row["original_price"])
    return product
