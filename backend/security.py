"""
Session and security helpers shared by the admin and customer auth modules.

- Session tokens are random 64-hex-character strings.
- Only the SHA-256 hash of a token is stored in the database, so a stolen
  database dump cannot be used to forge sessions.
- The token itself travels in an httpOnly cookie, invisible to JavaScript.
"""

import hashlib
import os
import secrets
import threading

from flask import request


def generate_token() -> str:
    return secrets.token_hex(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def client_ip() -> str:
    """Best-effort client IP (honors the proxy header used in production)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def _bool_env(name: str, default: str = "") -> bool:
    """Read a boolean env var, accepting 1/true/yes/on in any case."""
    return os.environ.get(name, default).strip().lower() in ("1", "true", "yes", "on")


def set_session_cookie(response, cookie_name: str, token: str, max_age_seconds: int):
    secure = _bool_env("COOKIE_SECURE")
    response.set_cookie(
        cookie_name,
        token,
        max_age=max_age_seconds,
        httponly=True,      # invisible to JavaScript — XSS cannot steal it
        secure=secure,      # HTTPS-only in production
        samesite="Lax",     # CSRF hardening
        path="/",
    )


def clear_session_cookie(response, cookie_name: str):
    response.delete_cookie(cookie_name, path="/")


class LoginRateLimiter:
    """
    Per-IP failed-login tracking, in memory (resets on server restart).

    After MAX_ATTEMPTS failures the IP is locked out for LOCKOUT_SECONDS.
    """

    def __init__(self, max_attempts: int, lockout_seconds: int):
        self.max_attempts = max_attempts
        self.lockout_seconds = lockout_seconds
        self._attempts = {}  # ip -> {"count": int, "locked_until": float}
        self._lock = threading.Lock()

    def seconds_locked(self, ip: str) -> int:
        """Remaining lockout seconds for this IP, 0 if not locked."""
        with self._lock:
            record = self._attempts.get(ip)
            if not record:
                return 0
            import time

            if record["locked_until"] > time.time():
                return int(record["locked_until"] - time.time()) + 1
            return 0

    def register_failure(self, ip: str) -> str:
        """Record a failed attempt. Returns the error message to show."""
        import time

        with self._lock:
            record = self._attempts.get(ip, {"count": 0, "locked_until": 0})
            count = record["count"] + 1
            if count >= self.max_attempts:
                self._attempts[ip] = {
                    "count": 0,
                    "locked_until": time.time() + self.lockout_seconds,
                }
                return "Too many failed attempts. Try again in 5 minutes."
            self._attempts[ip] = {"count": count, "locked_until": 0}
            remaining = self.max_attempts - count
            attempt_word = "attempt" if remaining == 1 else "attempts"
            return f"Invalid email or password. {remaining} {attempt_word} remaining."

    def reset(self, ip: str):
        with self._lock:
            self._attempts.pop(ip, None)
