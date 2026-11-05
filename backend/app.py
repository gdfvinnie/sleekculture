"""
sleekculture backend — Flask application.

Run in development:
    python app.py            (serves the API on port 3001)

In production the same server also serves the built frontend from
frontend/dist, so one process hosts the whole site.
"""

import os
import threading
import time
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException, RequestEntityTooLarge

from admin_auth import admin_auth
from analytics import analytics_bp
from customer_auth import customer_auth
from customer_session_guard import attach_bp
from database import PROJECT_ROOT, close_db, init_db
from orders import orders_bp
from products import products_bp
from uploads import uploads_bp
from web_search import web_search_bp


# Load the project-root .env (if present) before any module reads os.environ.
# Values already set in the real environment win, matching python-dotenv.
def _load_dotenv() -> None:
    env_file = Path(PROJECT_ROOT) / ".env"
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


_load_dotenv()

PORT = int(os.environ.get("PORT") or 3001) or 3001
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # hard request cap
    app.config["JSON_SORT_KEYS"] = False

    init_db()
    app.teardown_appcontext(close_db)

    app.register_blueprint(admin_auth)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(customer_auth)
    app.register_blueprint(products_bp)
    app.register_blueprint(uploads_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(web_search_bp)
    app.register_blueprint(attach_bp)

    # ---------------- JSON error responses (like the old backend) --------

    @app.errorhandler(RequestEntityTooLarge)
    def too_large(_e):
        return jsonify({"error": "Each image must be 2MB or smaller."}), 413

    @app.errorhandler(HTTPException)
    def http_error(e):
        if request.path.startswith("/api/"):
            messages = {
                404: "Not found.",
                405: "Method not allowed.",
            }
            return jsonify({"error": messages.get(e.code, e.description)}), e.code
        return e

    @app.errorhandler(Exception)
    def unexpected_error(e):
        print(f"[server] {type(e).__name__}: {e}")
        return jsonify({"error": "Internal server error."}), 500

    # ---------------- Production static serving --------------------------
    # When the frontend is built (frontend/dist), this one process serves
    # the whole site — API and app together on a single port.

    if os.path.isdir(FRONTEND_DIST):
        @app.get("/", defaults={"path": ""})
        @app.get("/<path:path>")
        def frontend(path):
            if path == "api" or path.startswith("api/"):
                return jsonify({"error": "Not found."}), 404
            candidate = os.path.normpath(os.path.join(FRONTEND_DIST, path))
            if (
                path
                and candidate.startswith(FRONTEND_DIST)
                and os.path.isfile(candidate)
            ):
                return send_from_directory(FRONTEND_DIST, path)
            return send_from_directory(FRONTEND_DIST, "index.html")

    return app


def _purge_loop():
    from database import DB_PATH
    import sqlite3

    while True:
        time.sleep(60 * 60)
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.execute("DELETE FROM admin_sessions WHERE expires_at <= datetime('now')")
            conn.execute("DELETE FROM user_sessions WHERE expires_at <= datetime('now')")
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[server] session purge skipped: {e}")


app = create_app()

purger = threading.Thread(target=_purge_loop, daemon=True)
purger.start()

if __name__ == "__main__":
    print(f"[server] sleekculture API + app on http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, threaded=True)
