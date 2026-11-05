"""
Customer account authentication: register, login, logout, and session
resolution. Fully separate from admin auth — different table, different
cookie, different endpoints.
"""

import os
import re
from datetime import timedelta

from flask import Blueprint, jsonify, request

from database import get_db, hash_password, utc_now, verify_password
from security import (
    LoginRateLimiter,
    clear_session_cookie,
    client_ip,
    generate_token,
    hash_token,
    set_session_cookie,
)

COOKIE_NAME = "sc_user_session"

USER_SESSION_TTL_DAYS = int(os.environ.get("USER_SESSION_TTL_DAYS", "30"))
MAX_ATTEMPTS = int(os.environ.get("MAX_LOGIN_ATTEMPTS", "5"))
LOCKOUT_MINUTES = int(os.environ.get("LOCKOUT_MINUTES", "5"))

limiter = LoginRateLimiter(MAX_ATTEMPTS, LOCKOUT_MINUTES * 60)

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")

# Used to keep the response time constant when an email doesn't exist.
DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZDZQj1Vp1p2b3c4d5e6f7g8h9i0jK"

customer_auth = Blueprint("customer_auth", __name__)


def _session_ttl_seconds() -> int:
    return USER_SESSION_TTL_DAYS * 24 * 60 * 60


def create_user_session(response, user_id: int):
    token = generate_token()
    expires_at = (utc_now() + timedelta(days=USER_SESSION_TTL_DAYS))
    expires_at = expires_at.replace(microsecond=0).isoformat().replace("+00:00", "Z")
    db = get_db()
    db.execute(
        "INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
        (hash_token(token), user_id, expires_at),
    )
    db.commit()
    set_session_cookie(response, COOKIE_NAME, token, _session_ttl_seconds())


def destroy_user_session(response):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        db = get_db()
        db.execute("DELETE FROM user_sessions WHERE token_hash = ?", (hash_token(token),))
        db.commit()
    clear_session_cookie(response, COOKIE_NAME)


def resolve_user():
    """Returns the signed-in customer row (joined with its session), or None."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    db = get_db()
    row = db.execute(
        """
        SELECT u.id, u.email, u.name, u.created_at, s.expires_at, s.token_hash
        FROM user_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?
        """,
        (hash_token(token),),
    ).fetchone()
    if row is None:
        return None
    try:
        expiry = utc_now().fromisoformat(row["expires_at"].replace("Z", "+00:00"))
    except ValueError:
        expiry = utc_now()
    if expiry <= utc_now():
        db.execute("DELETE FROM user_sessions WHERE token_hash = ?", (row["token_hash"],))
        db.commit()
        return None
    return row


@customer_auth.post("/api/account/register")
def register():
    body = request.get_json(silent=True) or {}
    email = body.get("email")
    password = body.get("password")
    name = body.get("name")

    clean_email = email.strip().lower() if isinstance(email, str) else ""
    clean_name = name.strip()[:80] if isinstance(name, str) else ""

    if not EMAIL_RE.match(clean_email):
        return jsonify({"error": "Please enter a valid email address."}), 400
    if not isinstance(password, str) or len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400
    if len(password) > 1024:
        return jsonify({"error": "Password is too long."}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ?", (clean_email,)).fetchone()
    if existing:
        return (
            jsonify({"error": "An account with this email already exists. Try signing in."}),
            409,
        )

    cursor = db.execute(
        "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
        (clean_email, hash_password(password), clean_name or None),
    )
    db.commit()

    response = jsonify({"user": {"email": clean_email, "name": clean_name or None}})
    create_user_session(response, cursor.lastrowid)
    return response, 201


@customer_auth.post("/api/account/login")
def login():
    body = request.get_json(silent=True) or {}
    email = body.get("email")
    password = body.get("password")
    clean_email = email.strip().lower() if isinstance(email, str) else ""

    ip = client_ip()

    locked_seconds = limiter.seconds_locked(ip)
    if locked_seconds:
        mins = (locked_seconds + 59) // 60
        minute_word = "minute" if mins == 1 else "minutes"
        return (
            jsonify(
                {"error": f"Too many failed attempts. Locked for {mins} more {minute_word}."}
            ),
            429,
        )

    if not EMAIL_RE.match(clean_email) or not isinstance(password, str):
        return jsonify({"error": limiter.register_failure(ip)}), 401

    db = get_db()
    user = db.execute(
        "SELECT id, email, name, password_hash FROM users WHERE email = ?",
        (clean_email,),
    ).fetchone()

    # Constant-shape response even when the user doesn't exist.
    if user is None:
        verify_password(password, DUMMY_HASH)
        return jsonify({"error": limiter.register_failure(ip)}), 401

    if not verify_password(password, user["password_hash"]):
        return jsonify({"error": limiter.register_failure(ip)}), 401

    limiter.reset(ip)
    response = jsonify({"user": {"email": user["email"], "name": user["name"]}})
    create_user_session(response, user["id"])
    return response, 200


@customer_auth.post("/api/account/logout")
def logout():
    response = jsonify({"ok": True})
    destroy_user_session(response)
    return response


@customer_auth.get("/api/account/me")
def me():
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return jsonify({"error": "Not signed in."}), 401
    row = resolve_user()
    if row is None:
        return jsonify({"error": "Session expired."}), 401
    return jsonify(
        {"user": {"email": row["email"], "name": row["name"], "memberSince": row["created_at"]}}
    )
