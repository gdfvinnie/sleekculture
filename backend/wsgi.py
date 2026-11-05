"""
WSGI entry point — used by PythonAnywhere (and any other WSGI server).

On PythonAnywhere, point the web app's WSGI file at this module:

    from wsgi import app

The app factory reads the project-root .env first (falling back to real
environment variables), initializes the SQLite schema if needed, and —
when frontend/dist exists — serves the built storefront from the same
process, so one web app hosts the whole site.
"""

import os
import sys

# Make backend/ importable regardless of the WSGI host's working directory.
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app  # noqa: E402

app = create_app()
