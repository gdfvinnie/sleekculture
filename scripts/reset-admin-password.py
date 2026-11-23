#!/usr/bin/env python3
"""
Create or reset the sleekculture admin account.

The backend only seeds an admin on the very first boot, so changing
ADMIN_PASSWORD later has no effect on an existing database. Run this to
apply new credentials to an existing install:

    python scripts/reset-admin-password.py

It reads ADMIN_EMAIL / ADMIN_PASSWORD from the environment or the
project-root .env (same precedence as the app: real env wins).

You can also pass values explicitly:

    python scripts/reset-admin-password.py someone@example.com 'new-password'

Safe to run repeatedly; it never touches products, orders or customers.
"""

import os
import sqlite3
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))


def load_dotenv() -> None:
    """Mirror app.py: project-root .env, real environment wins."""
    env_file = PROJECT_ROOT / ".env"
    if not env_file.is_file():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def main() -> int:
    load_dotenv()

    if len(sys.argv) >= 3:
        email, password = sys.argv[1], sys.argv[2]
    else:
        email = os.environ.get("ADMIN_EMAIL") or ""
        password = os.environ.get("ADMIN_PASSWORD") or ""

    email = email.strip().lower()
    if not email or not password:
        print(
            "error: set ADMIN_EMAIL and ADMIN_PASSWORD in .env, "
            "or pass them as arguments.",
            file=sys.stderr,
        )
        return 2
    if len(password) < 8:
        print("error: password must be at least 8 characters.", file=sys.stderr)
        return 2

    # Import after .env is loaded so DATA_DIR/DB_PATH resolve correctly.
    from database import DB_PATH, hash_password

    if not Path(DB_PATH).is_file():
        print(
            f"error: no database at {DB_PATH}. Start the backend once "
            "(python backend/app.py) so it creates and seeds the database.",
            file=sys.stderr,
        )
        return 1

    password_hash = hash_password(password)
    conn = sqlite3.connect(DB_PATH)
    try:
        row = conn.execute(
            "SELECT id FROM admin_users WHERE email = ?", (email,)
        ).fetchone()
        if row:
            conn.execute(
                "UPDATE admin_users SET password_hash = ?, role = 'admin' WHERE id = ?",
                (password_hash, row[0]),
            )
            action = "updated"
        else:
            conn.execute(
                "INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, 'admin')",
                (email, password_hash),
            )
            action = "created"
        # Changing the password invalidates any existing admin sessions.
        conn.execute(
            "DELETE FROM admin_sessions WHERE admin_id IN "
            "(SELECT id FROM admin_users WHERE email = ?)",
            (email,),
        )
        conn.commit()
    finally:
        conn.close()

    print(f"[admin] {action}: {email}")
    print("[admin] existing admin sessions were signed out")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
