# Deploying sleekculture on Hosting.com

Hosting.com shared plans are **cPanel on Linux** with **Phusion Passenger**, which
supports Python WSGI apps through cPanel → **Setup Python App**. This project is
exactly that: one Flask process that serves both the API and the built
storefront, so the whole store runs on one Hosting.com account — no Vercel, no
Node runtime, no external services required.

Nothing here changes your existing deployments. Leave Vercel and GitHub Pages
running until this one is verified.

---

## 1. Framework and technologies

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend | React 18 + Vite 5 + Tailwind CSS | Static build, output `frontend/dist` |
| Routing | React Router **HashRouter** (`#/shop`) | No `.htaccess` rewrites needed — deep links work on any server |
| Data fetching | TanStack Query, `fetch` to `/api/*` | Same origin, cookies included |
| Backend | Python 3 **Flask** (WSGI) | Entry `backend/app.py`, `backend/wsgi.py` |
| Server | **Phusion Passenger** (cPanel) | WSGI only — not async, no Uvicorn/Gunicorn needed |
| Database | **SQLite** (`data/sleekculture.db`) | File-based; no MySQL setup required |
| Sessions | httpOnly cookies + server-side session rows | bcrypt password hashes |
| Payments | Paystack (optional, server-verified) | Needs outbound HTTPS to `api.paystack.co` |

Python version: Hosting.com's selector offers 3.9–3.12. **Pick 3.11 or 3.12**
(3.9 is past end-of-life). All dependencies support them.

---

## 2. Build settings

Node is not available on shared hosting, so build the frontend **on your own
computer** and upload the result.

```bash
cd frontend
npm ci
SITE_URL=https://yourdomain.com npm run build     # Windows Git Bash: same line
```

| Setting | Value |
| --- | --- |
| Build command | `npm run build` (inside `frontend/`) |
| Output directory | `frontend/dist` |
| Build env var | `SITE_URL=https://yourdomain.com` (no trailing slash; apex or `www`, whichever you will actually serve) |
| `BASE_PATH` | leave unset — the site will live at the domain root |

`SITE_URL` is baked into the canonical tag, `og:` tags, `robots.txt` and
`sitemap.xml`. If you deploy to a sub-folder (e.g. `example.com/store`), use
`SITE_URL=https://example.com/store BASE_PATH=/store`.

The backend also reads `frontend/dist` at runtime; there is no server-side build
step.

---

## 3. What to upload

Upload to a folder **outside** `public_html`, e.g. `/home/USERNAME/sleekculture`:

```
sleekculture/
├── passenger_wsgi.py      (included in the repo — keep it at this level)
├── backend/               whole folder
├── frontend/dist/         the build you just made
├── data/                  ONLY if you are carrying over existing products/orders
├── .env                   you create this on the server (see step 5)
└── frontend/              the rest of frontend/ is optional; dist is what runs
```

Do **not** put the app inside `public_html`: Python source, the `.env` file and
the SQLite database would then be downloadable by anyone.

Easiest upload path: cPanel → **File Manager** → create `sleekculture` → upload a
zip of the project → **Extract**. `sleekculture-portable.zip` from the repo root
is already shaped for this (it excludes `node_modules`, `.venv`, `data/`,
secrets and build output — add your own `frontend/dist` folder afterwards).

If Hosting.com has enabled SSH for your account, `scp` is faster:

```bash
scp -r sleekculture/ USER@your-server:/home/USER/sleekculture
```

---

## 4. Create the Python application in cPanel

1. cPanel → **Software** → **Setup Python App** → **CREATE APPLICATION**.
2. **Python version:** 3.11 or 3.12.
3. **Application root:** `sleekculture` (the folder from step 3).
4. **Application URL:** choose your domain and leave the path **empty**, so the
   store owns the whole domain (`https://yourdomain.com/`).
5. **Application startup file:** `passenger_wsgi.py`
   **Application entry point:** `application`
   (Leave both blank if the form requires nothing here — Passenger then uses the
   `passenger_wsgi.py` we ship.)
6. **Passenger log file:** `stderr.log` (useful for diagnosis).
7. Click **CREATE**. cPanel builds a virtualenv and creates a stub
   `passenger_wsgi.py`.

**Replace that stub** with the one from this repo (File Manager → edit
`passenger_wsgi.py`), which is:

```python
import os, sys
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
from wsgi import app as application
```

---

## 5. Install dependencies and configure

In the Setup Python App screen, copy the **"Enter to the virtual environment"**
command (it looks like
`source /home/USER/virtualenv/sleekculture/3.12/bin/activate && cd /home/USER/sleekculture`)
and run it over SSH, then:

```bash
pip install -r backend/requirements.txt
```

No SSH? The same screen has **Run Pip Install** — point it at
`backend/requirements.txt`.

Create the config file in the app root (`/home/USER/sleekculture/.env`):

```bash
cat > ~/sleekculture/.env <<'EOF'
ADMIN_EMAIL=jnrvinnie@gmail.com
ADMIN_PASSWORD=REPLACE-WITH-A-NEW-STRONG-PASSWORD
COOKIE_SECURE=1
PORT=3001
EOF
chmod 600 ~/sleekculture/.env
```

| Variable | Value on Hosting.com |
| --- | --- |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Read **only on first boot** to create the admin. Afterwards change it in Admin → Settings. |
| `COOKIE_SECURE` | `1` — **only after HTTPS works** (step 7). With `1` over plain HTTP, sign-in silently fails. |
| `DATA_DIR` | Leave unset → `/home/USER/sleekculture/data`. Persistent across restarts; this is your whole datastore. |
| `PORT` | Ignored by Passenger; harmless. |
| `PAYSTACK_SECRET_KEY` | Optional — `sk_test_…` to test card payments, `sk_live_…` when ready. |
| `EXA_API_KEY` | Optional admin web search. |

Make sure the app can write to `data/`:

```bash
mkdir -p ~/sleekculture/data/uploads && chmod 755 ~/sleekculture/data ~/sleekculture/data/uploads
```

On first request the app creates `data/sleekculture.db` and seeds the product
catalog from `backend/fallback_products.json`, so an empty `data/` still gives
you a working store. Copy an existing `data/` over only to keep real orders and
uploads.

---

## 6. Restart and test

cPanel → Setup Python App → **RESTART** (do this after every code or env change —
Passenger caches the process).

Check, in this order:

| URL | Expected |
| --- | --- |
| `https://yourdomain.com/` | Homepage, hero image, product grid |
| `https://yourdomain.com/api/products` | JSON array (proves the Python app is running) |
| `https://yourdomain.com/#/shop` | Category page |
| `https://yourdomain.com/#/product/<id>` | Product detail with sizes/colours |
| `https://yourdomain.com/robots.txt` | Shows your domain in the Sitemap line |
| `https://yourdomain.com/#/admin` | Admin sign-in; use the `.env` credentials |

If `/` returns the Hosting.com "It works!" page, the Application URL is not
mapped to the Python app. If `/api/products` returns HTML, the frontend build is
missing from `frontend/dist`.

---

## 7. Domain, DNS and SSL

1. **Point the domain at Hosting.com.** Either set the domain's nameservers to
   the pair Hosting.com shows in cPanel → *Domains* (recommended), or keep your
   current DNS and add an `A` record for `@` pointing at the account's server IP
   plus a `CNAME` for `www`. Use exactly the values the dashboard prints — they
   are account-specific.
2. **Add the domain in cPanel → Domains** so the account answers for it.
3. **SSL:** cPanel → **SSL/TLS Status** → *Run AutoSSL* (free Let's Encrypt
   certificate). Wait for "issued".
4. **Force HTTPS:** cPanel → Domains → the domain's settings → enable
   **Force HTTPS Redirect**.
5. Only now set `COOKIE_SECURE=1` in `.env` and **RESTART** the app.
6. Change the admin password in Admin → Settings, since the `.env` value was
   typed once and seeding only happens on first boot.

DNS propagation can take an hour; check with `nslookup yourdomain.com`.

---

## 8. Static-only alternative (no Python)

If you only want the storefront (browsing, cart, checkout simulated in the
visitor's browser, no admin/accounts/real orders):

1. Build with `SITE_URL=https://yourdomain.com npm run build`.
2. Upload the **contents of `frontend/dist`** into `public_html`.
3. Hosting.com already serves `index.html`; add nothing.

The storefront detects the missing backend and shows demo mode automatically.
This is a fallback, not the recommended route — orders are not saved on the
server.

---

## 9. Shared-hosting characteristics to know

| Topic | Reality on shared hosting |
| --- | --- |
| Concurrency | Passenger runs your app in a single account process group; fine for low-traffic stores, and it can hit CPU/memory limits under load (503/508 errors). |
| Async servers | Not used. The app is plain WSGI; `waitress` is installed but Passenger drives it. |
| Background threads | The session-purge thread works, but may be killed between requests; expired sessions are also filtered on read, so nothing breaks. |
| SQLite | Writes via WAL mode; fine for this workload. Back up `data/` regularly — it is the entire datastore. |
| Outbound HTTPS | Needed for Paystack (`api.paystack.co`) and Exa. Usually allowed; if payments fail with a connection error, ask support to open it. |
| Uploads | Images up to 2 MB, requests capped at 16 MB. Both are app-side, not PHP settings. |
| Email | The app does **not** send email yet. Order confirmations on-screen only. |
| Backups | cPanel → Backup / Backup Wizard, plus copy `data/` before any migration. |

---

## 10. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| "It works!" page | Application URL not mapped, or app not created for that domain. |
| 500 on every page | Missing dependency: activate the venv and `pip install -r backend/requirements.txt`, then RESTART. |
| `ModuleNotFoundError: wsgi` | `passenger_wsgi.py` is in the wrong folder — it must sit beside `backend/`. |
| Blank page, 404s on assets | Built with a wrong `SITE_URL`/`BASE_PATH`, or `frontend/dist` not uploaded. Rebuild and re-upload. |
| Sign-in appears to work then forgets you | `COOKIE_SECURE=1` while the site is still HTTP. Fix SSL, or set `COOKIE_SECURE=0` temporarily. |
| Images uploaded in admin don't show | `data/uploads` missing or not writable (`chmod 755`). |
| Login says "database is locked" | Two processes writing at once during a long request; retry. Rare in normal use. |
| Changes don't appear | Passenger caches code — RESTART the app, and hard-refresh the browser for hashed assets. |
| `stderr.log` grows huge | Truncate it via File Manager; it logs every request line. |

---

## 11. After Hosting.com is verified

1. Run the checklist in section 6 on the real domain, including a test order.
2. Then, and only then, retire the old deployments (Vercel project, GitHub
   Pages) — or keep them as a staging copy.
3. Submit `https://yourdomain.com/sitemap.xml` in Google Search Console.

Your GitHub repository, Vercel project and existing source are untouched by
everything in this document.
