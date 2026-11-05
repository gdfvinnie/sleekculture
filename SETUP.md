# Setup & Deployment Guide — sleekculture

Everything you need to get the store online. Pick **one** row:

| Where | What works | Effort |
|---|---|---|
| **PythonAnywhere / Render / Docker** (full stack) | **Everything** — real orders, accounts, admin panel, uploads, payments | upload the deploy zip |
| **Netlify / Vercel / GitHub Pages** (static) | Demo mode: products, cart, checkout all work; orders are stored in the shopper's browser; admin & accounts are disabled gracefully | repo import or drag-and-drop |

---

## Option A — Full stack (recommended for selling)

One Flask process serves the API **and** the built storefront.

### PythonAnywhere (cheapest, Web-based)
1. Upload `sleekculture-deploy.zip` via the Files tab and unzip it (or clone the repo).
2. Web tab → *Add a new web app* → manual config → Python 3.10.
3. Virtualenv: create one, then `pip install -r backend/requirements.txt`.
4. Source code: your unzipped folder. Working directory: that folder.
5. WSGI file: point it at `backend/wsgi.py` (an example snippet is in the zip's `backend/wsgi.py`).
6. Set env vars in the WSGI file or web-tab panel:
   - `DATA_DIR=<your folder>/data`
   - `COOKIE_SECURE=1` (only if serving via HTTPS)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (used **only** on first boot)
7. Reload. One process now serves the whole site.

### Render / Railway / Fly / any PaaS with Docker
- The included `Dockerfile` builds everything and runs `backend/app.py` on `$PORT`.
- Everything persistent lives in `data/` — mount a volume there or set `DATA_DIR` to a persistent disk, or you lose orders on redeploy.

### Local production check
```bash
cd frontend && npm install && npm run build   # → frontend/dist
cd .. && pip install -r backend/requirements.txt
python backend/app.py                         # one server on :3001 serving everything
```

---

## Option B — Static hosting (Netlify / Vercel / GitHub Pages)

The frontend auto-detects that no backend exists and switches to **demo mode**:

- ✅ Browsing, search, filters — bundled catalog snapshot
- ✅ Cart, checkout, order confirmation — simulated locally, saved in the browser
- ✅ Contact page — opens the visitor's mail app
- ✅ Hero/banner/product images — included in the build
- ⛔ Admin panel, account sign-in, image uploads — shown with a clear message
  (they need the Python backend; that is by design, not a bug)

### Netlify
- **Repo import:** connect the repo; Netlify reads `netlify.toml` (builds `frontend`, publishes `frontend/dist`).
- **Drag-and-drop:** build locally (`cd frontend && npm run build`), then drop the **`frontend/dist` folder** onto https://app.netlify.com/drop.

### Vercel
1. Import the repo on vercel.com.
2. **Root Directory:** `frontend` (Vercel reads `frontend/vercel.json`).
3. Framework preset: Vite; it builds `npm run build` → `dist`.

### GitHub Pages (project site `/<repo-name>/`)
1. Push this repo to GitHub; keep the workflow file `.github/workflows/deploy-frontend.yml`.
2. Settings → Pages → **Source: GitHub Actions**.
3. Every push to `main` builds the frontend with the correct asset base path and publishes it.
4. Deep links are converted on the fly (404.html → `/#/shop`), so shared links work.
5. Prefer `<user>.github.io` root or a custom domain? Remove `BASE_PATH` from the workflow build step.

### Keeping the demo catalog fresh
The static build ships a snapshot of your live catalog (`frontend/src/data/catalog.json` + `frontend/public/media`). After changing products in the admin panel of the full-stacked site:

```bash
cd frontend
node ../scripts/export-catalog.mjs    # backend must be running locally on :3001
npm run build
```

Then redeploy/update the static host.

---

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `DATA_DIR` | backend | Where the SQLite DB + uploaded images live |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | backend | Seeds the first admin account (first boot only) |
| `COOKIE_SECURE` | backend | Set to `1` when serving over HTTPS |
| `SESSION_TTL_HOURS`, `MAX_LOGIN_ATTEMPTS`, `LOCKOUT_MINUTES` | backend | Session/lockout tuning |
| `PAYSTACK_SECRET_KEY` | backend | Enables real server-side payment verification at checkout |
| `EXA_API_KEY` | backend | Optional Exa key for web search (`POST /api/search/web`, admin-only) |
| `PORT` | backend | Listen port (default 3001) |
| `BASE_PATH` | frontend build | Sub-path base for GitHub Pages (`/<repo-name>`) |

## Common pitfalls

- **Serving only the frontend for a "real" store** — static hosts cannot run Flask. That's fine (demo mode is graceful), but pairs badly with real payments. Use Option A for production commerce.
- **SQLite needs persistence** — on PaaS platforms mount a volume at `data/` (see `Dockerfile` and Option A).
- **GitHub Pages subpath** — always build with `BASE_PATH=/<repo-name>`; otherwise assets 404.
- **Admin panel blank on static deploys** — expected; attach the backend (Option A) to restore it.
