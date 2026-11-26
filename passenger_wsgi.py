"""Passenger entry point for cPanel shared hosting (Hosting.com, Namecheap,
Stablehost, cPanel/DirectAdmin resellers, etc.).

cPanel's "Setup Python App" (Phusion Passenger) looks for a `passenger_wsgi.py`
in the application root and expects a WSGI callable named `application`.
Our real app lives in backend/ and is built by backend/app.py, which also
serves the compiled storefront from frontend/dist — so this file only has to
wire the import path and re-export it.

Layout it expects (application root = the project directory):

    sleekculture/
        passenger_wsgi.py      <- this file
        backend/
        frontend/dist/         <- built storefront
        data/                  <- SQLite DB + uploads (created on first boot)

All paths inside the app are derived from absolute locations, so the working
directory does not matter.

Local development does not use this file: run `python backend/app.py` instead.
"""

import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from wsgi import app as application  # noqa: E402,F401
