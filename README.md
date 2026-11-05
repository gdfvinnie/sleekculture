# sleekculture — Contemporary Streetwear E-Commerce

A minimal, premium clothing storefront with a fully self-contained Python
backend. No third-party auth services — authentication, database, sessions,
and uploads all run on the project's own Flask + SQLite server.

## Quick start

Requirements: Python 3.10+ and Node 18+.

```bash
# 1. Backend
pip install -r backend/requirements.txt
python backend/app.py            # API on http://localhost:3001

# 2. Frontend (second terminal)
cd frontend
npm install
npm run dev                      # app on http://localhost:5173
```

Open http://localhost:5173 — the admin dashboard lives at `/#/admin`
(default admin: `jnrvinnie@gmail.com`, seeded on first boot from the
`ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables).

## Architecture

```
frontend/                 React + JavaScript (Vite)
  src/pages/              one component per page (Index, Shop, Admin, …)
  src/components/         reusable UI (Navbar, Sidebar, ProductCard, …)
  src/context/            React context: auth, cart, country/currency
  src/lib/api.js          REST client with static-host demo fallback — the only place that talks to the API
  vite.config.js          dev proxy: /api → Flask on port 3001; BASE_PATH for Pages subdeploys

backend/                  Python 3 (Flask), REST API
  app.py                  app factory, production static serving, WSGI entry
  database.py             SQLite schema, seeding, row ↔ product mapping
  security.py             sessions, cookies, rate limiting
  admin_auth.py           /api/auth/*        — admin login/logout/me
  customer_auth.py        /api/account/*     — register/login/logout/me
  products.py             /api/products/*    — public read, admin CRUD
  uploads.py              /api/upload, /api/media — image upload/serving
  web_search.py           /api/search/web — Exa web search (needs EXA_API_KEY)

scripts/                  Node helper scripts (deploy tooling)
  export-catalog.mjs      refreshes the bundled demo catalog from the live DB
  write-404.mjs           generates dist/404.html for GitHub Pages deep links

data/                     SQLite DB + uploaded images (the whole datastore)
```

- The frontend is plain React (JavaScript, JSX) styled with Tailwind CSS.
- The backend is a straightforward Flask REST API with a SQLite database.
- In development, Vite serves the app and proxies API calls to Flask.
- In production, one Flask process serves both the API and the built app.

## Auth flow

1. **Login / register** — `POST /api/auth/login` (admin) and
   `POST /api/account/register|login` (customers) verify credentials against
   bcrypt hashes (timing-safe), apply per-IP lockout after repeated
   failures, then mint a random 256-bit token. Only the token's SHA-256
   hash is stored; the raw token returns as an `httpOnly`, `SameSite=Lax`
   cookie (`secure` in production).
2. **Session** — protected routes resolve cookie → session → user on every
   call; expired sessions are deleted and return 401.
3. **Logout** — `POST /api/auth/logout` / `POST /api/account/logout` deletes
   the server-side session row and clears the cookie.
4. **Gate** — `/admin` resolves `GET /api/auth/me` on load; no valid session
   renders the login screen. All data-changing routes are enforced
   server-side, where it actually matters.

## Production

```bash
cd frontend && npm run build   # outputs frontend/dist
python backend/app.py          # one process serves everything on $PORT
```

- Set `COOKIE_SECURE=1` and run behind HTTPS.
- Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` before first boot — seeding only
  happens once; existing users are left untouched.
- Everything persistent lives under `DATA_DIR` (default `../data` relative
  to the backend) — back that directory up; it is the entire datastore.
- All secrets are read from the environment, never committed.
- `DEPLOY.md` and the `Dockerfile` cover publishing (Docker works anywhere;
  Railway has been used previously).

## Deploying to Netlify / Vercel / GitHub Pages

See **[SETUP.md](SETUP.md)** for the full, per-platform guide. In short: the
static build auto-detects the missing backend and runs in demo mode
(browsing/cart/checkout work with a bundled catalog; admin & accounts are
disabled with a clear message). The deploy zip targets the full stack
(Option A).
