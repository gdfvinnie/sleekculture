"""
Admin authentication: login, logout, session resolution, and the
require_admin guard that protects every admin-only route.
"""

import os
from datetime import timedelta
from functools import wraps

from flask import Blueprint, jsonify, request

from database import get_db, utc_now, verify_password
from security import (
    LoginRateLimiter,
    clear_session_cookie,
    client_ip,
    generate_token,
    hash_token,
    set_session_cookie,
)

COOKIE_NAME = "sc_admin_session"

SESSION_TTL_HOURS = int(os.environ.get("SESSION_TTL_HOURS", "8"))
MAX_ATTEMPTS = int(os.environ.get("MAX_LOGIN_ATTEMPTS", "5"))
LOCKOUT_MINUTES = int(os.environ.get("LOCKOUT_MINUTES", "5"))

limiter = LoginRateLimiter(MAX_ATTEMPTS, LOCKOUT_MINUTES * 60)

admin_auth = Blueprint("admin_auth", __name__)


def _session_ttl_seconds() -> int:
    return SESSION_TTL_HOURS * 60 * 60


def create_admin_session(response, admin_id: int):
    token = generate_token()
    expires_at = (utc_now() + timedelta(hours=SESSION_TTL_HOURS))
    expires_at = expires_at.replace(microsecond=0).isoformat().replace("+00:00", "Z")
    db = get_db()
    db.execute(
        "INSERT INTO admin_sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)",
        (hash_token(token), admin_id, expires_at),
    )
    db.commit()
    set_session_cookie(response, COOKIE_NAME, token, _session_ttl_seconds())


def destroy_admin_session(response):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        db = get_db()
        db.execute("DELETE FROM admin_sessions WHERE token_hash = ?", (hash_token(token),))
        db.commit()
    clear_session_cookie(response, COOKIE_NAME)


def resolve_admin():
    """
    Returns the signed-in admin row (joined with its session), or None.
    Expired sessions are deleted on sight.
    """
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    db = get_db()
    row = db.execute(
        """
        SELECT a.id, a.email, a.role, s.expires_at, s.token_hash
        FROM admin_sessions s
        JOIN admin_users a ON a.id = s.admin_id
        WHERE s.token_hash = ?
        """,
        (hash_token(token),),
    ).fetchone()
    if row is None:
        return None
    if _is_expired(row["expires_at"]):
        db.execute("DELETE FROM admin_sessions WHERE token_hash = ?", (row["token_hash"],))
        db.commit()
        return None
    return row


def _is_expired(expires_at: str) -> bool:
    try:
        expiry = utc_now().fromisoformat(expires_at.replace("Z", "+00:00"))
        return expiry <= utc_now()
    except ValueError:
        return True


def require_admin(view):
    """Route guard: resolves the session cookie to an admin, else 401."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        admin = resolve_admin()
        if admin is None:
            return jsonify({"error": "Authentication required."}), 401
        request.admin = {"id": admin["id"], "email": admin["email"], "role": admin["role"]}
        return view(*args, **kwargs)

    return wrapper


@admin_auth.post("/api/auth/login")
def login():
    body = request.get_json(silent=True) or {}
    email = body.get("email")
    password = body.get("password")

    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({"error": "Email and password are required."}), 400
    if len(email) > 254 or len(password) > 1024:
        return jsonify({"error": "Invalid email or password."}), 400

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

    db = get_db()
    admin = db.execute(
        "SELECT id, email, role, password_hash FROM admin_users WHERE email = ?",
        (email.strip().lower(),),
    ).fetchone()

    if admin is None or not verify_password(password, admin["password_hash"]):
        return jsonify({"error": limiter.register_failure(ip)}), 401

    limiter.reset(ip)
    response = jsonify(
        {"admin": {"email": admin["email"], "role": admin["role"]}}
    )
    create_admin_session(response, admin["id"])
    return response, 200


@admin_auth.post("/api/auth/logout")
def logout():
    response = jsonify({"ok": True})
    destroy_admin_session(response)
    return response


@admin_auth.get("/api/auth/me")
def me():
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return jsonify({"error": "Not signed in."}), 401
    row = resolve_admin()
    if row is None:
        return jsonify({"error": "Session expired."}), 401
    return jsonify({"admin": {"email": row["email"], "role": row["role"]}})
