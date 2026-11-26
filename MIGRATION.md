# Migrating sleekculture to a new host and domain

This project is **host-agnostic**: the frontend is a plain Vite build (static
files) and the backend is a plain Flask app that can run on any Python host. No
source code imports a Vercel SDK, API, or serverless function — the only
Vercel-related file in the repo is one optional config file (see
[What about the Vercel files](#what-about-the-vercel-files)).

Nothing in this document destroys anything: your GitHub repository, git history
and source files stay exactly as they are.

---

## 1. What carries over untouched

| Item | Location | Notes |
| --- | --- | --- |
| Source code, components, styles | `frontend/src`, `frontend/index.html`, `tailwind.config.js` | Unchanged by migration |
| Images, logo, hero, fonts | `frontend/public`, `backend/uploads` | Bundled; no external CDN dependency except Google Fonts |
| Product catalog (demo fallback) | `frontend/src/data/catalog.json` | Used automatically when no backend answers |
| Live catalog, orders, customers | `data/app.db` + `data/uploads` | **Copy this whole directory** to the new host |
| API | `backend/` (Flask) | Runs anywhere Python 3.10+ runs |
| Routing | HashRouter (`#/shop`) | No server rewrite rules required — this is why the static build survives any host |

Because routes are hash-based, deep links such as
`https://yourdomain.com/#/shop` work on every platform without extra rewrites.

---

## 2. Build command and output directory

Run inside the **`frontend`** directory:

```bash
npm ci          # install (repeatable, uses package-lock.json)
npm run build   # builds + writes robots.txt, sitemap.xml, 404.html
```

| Setting | Value |
| --- | --- |
| Install command | `npm ci` (or `npm install`) |
| Build command | `npm run build` |
| Root / base directory | `frontend` |
| Output / publish directory | `dist` (i.e. `frontend/dist`) |
| Node version | 20 or 22 (`.nvmrc` not required; CI uses 20) |

For a **full-stack** deployment (real orders, accounts, admin) you do not build
by hand: `Dockerfile` builds the frontend and serves `frontend/dist` + the API
from one Python process. Build command for Docker/Render: `docker build .`,
start command `python app.py`, port `$PORT` (default `3001`).

---

## 3. Environment variables

### 3a. Build-time (frontend) — set in the hosting provider's build settings

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `SITE_URL` | **yes for a new domain** | `https://gdfvinnie.github.io/sleekculture` | Absolute public address, **no trailing slash**. Baked into canonical link, `og:url`, `og:image`, `twitter:image`, `robots.txt` and `sitemap.xml`. Include a sub-path if the site is not at the domain root. |
| `BASE_PATH` | only for sub-folder hosting | `/` | Where the site is served from, e.g. `/sleekculture` on GitHub Pages project sites. Also add a trailing-slash-free value here (Vite adds the slash). |

Examples:

```bash
SITE_URL=https://sleekculture.ng npm run build          # custom domain at root
SITE_URL=https://www.sleekculture.ng npm run build      # www host
SITE_URL=https://user.github.io/repo BASE_PATH=/repo npm run build
```

> `SITE_URL` is compiled into the HTML at build time. After changing your
> domain you must **redeploy/rebuild**, not just restart.

### 3b. Runtime (backend) — set in the host's environment panel

| Variable | Required | Notes |
| --- | --- | --- |
| `ADMIN_EMAIL` | first boot | Seeds the admin account once (default `jnrvinnie@gmail.com`). Change it to move admin login to another address **before first boot**; afterwards use Settings → Admin Account. |
| `ADMIN_PASSWORD` | first boot | Strong password; stored only as a bcrypt hash. If unset, a random password is generated and printed once in the server log. |
| `COOKIE_SECURE` | production | `1` — session cookies require HTTPS. |
| `DATA_DIR` | recommended | Directory holding SQLite DB + uploads. Default `<project>/data`. Point it at a **persistent volume/disk** on Render, Railway, Fly, VPS. |
| `PORT` | platform-dependent | `3001` locally; most platforms inject their own. |
| `SESSION_TTL_HOURS` | optional | Admin session length, default 8. |
| `USER_SESSION_TTL_DAYS` | optional | Customer session length, default 30. |
| `MAX_LOGIN_ATTEMPTS` / `LOCKOUT_MINUTES` | optional | Login rate limiting, defaults 5 / 5. |
| `PAYSTACK_SECRET_KEY` | optional | Enables card payments with server-side verification. Unset = card option hidden; bank transfer and pay-on-delivery still work. |
| `EXA_API_KEY` | optional | Admin-only web search endpoint; unset = endpoint answers 503. |

Secrets are read from the environment only and are never committed. Copy
`.env.example` → `.env` for local development.

---

## 4. Platform recipes

All of these run the **same** `frontend` → `dist` build. Pick one.

### Netlify (static or full stack)
- `netlify.toml` is already in the repo: base `frontend`, command `npm run build`, publish `dist`, and `/api/*` forced to 404 so the demo fallback engages.
- Set `SITE_URL` under **Site settings → Build & deploy → Environment variables**, then trigger a deploy.
- Drag-and-drop works too: drop `frontend/dist` on app.netlify.com/drop.

### Vercel
- Keep Root Directory `frontend`; `frontend/vercel.json` already sets build/output/rewrites.
- Add `SITE_URL` in Project → Settings → Environment Variables (Production), redeploy.

### Cloudflare Pages
- Framework preset: *Vite*. Build command `npm run build`, build output `dist`, root directory `frontend`.
- Add `SITE_URL` as a production environment variable.

### Render / Railway / Fly.io / any Docker host (full stack)
- `render.yaml` blueprint or plain `docker build .` — the same process serves the storefront, the API and the admin panel on one HTTPS URL, with `/app/data` on a disk.
- Add `SITE_URL` as a build arg/environment variable so the built HTML points at your domain.

### PythonAnywhere / cPanel / shared Python hosting (full stack)
- Follow `DEPLOY.md` Part B: build `frontend/dist` locally, upload, point WSGI at `backend/wsgi.py`, then set `SITE_URL` for that build (`SITE_URL=https://yourdomain.com npm run build`).
- Build with `BASE_PATH` unset and `SITE_URL` set to the final domain.

### Any static host without a build step
- Build locally with `SITE_URL=https://yourdomain.com npm run build` and upload the **contents of `frontend/dist`**.

---

## 5. Domain switch checklist

1. **DNS** — for a root domain (`sleekculture.ng`) point an `A`/`ALIAS` record at the host's IP or target; for `www` use a `CNAME` to the host-issued target. Most platforms (Netlify/Vercel/Cloudflare/Render) print the exact records in their dashboard — always use those.
2. **SSL** — enable the host's free certificate (Let's Encrypt / automatic). Wait for "issued", then test `https://` and confirm `http://` redirects to it.
3. **Rebuild with the new domain** — `SITE_URL=https://yourdomain.com`. Verify the rendered page contains the new canonical/`og:url`, and that `/robots.txt` and `/sitemap.xml` show the new domain.
4. **Backend** — `COOKIE_SECURE=1`, `DATA_DIR` on a persistent disk, admin password set.
5. **Choose one canonical host shape** (apex or `www`) and redirect the other, so SEO tags don't compete.
6. **Old deployment** — leave it running until the new one is verified, then redirect or shut it down. Nothing in this repo needs to be deleted.
7. **Search engines** — resubmit `https://yourdomain.com/sitemap.xml` in Google Search Console after the move.

Copying existing data to the new host:

```bash
# stop the old app first so the DB file is consistent, then:
scp -r data/ user@newhost:/path/to/project/
```

`data/` is the entire datastore: SQLite database, product images, uploaded files.

---

## 6. Post-migration verification (2 minutes)

| Check | Expected |
| --- | --- |
| `/` loads | Homepage with hero image and product grid |
| `/#/shop`, `/#/foundation`, `/#/accessories` | Category pages render |
| Open a product (`/#/product/<id>`) | Images, price, sizes, colours |
| Add to bag → quantity → remove | Cart drawer updates, survives reload |
| `/#/checkout` → submit with test details | Confirmation page appears |
| `/#/contact` | Enquiry form submits |
| `/#/privacy`, `/#/terms`, `/#/faq`, `/#/shipping`, `/#/size-guide` | Pages render |
| `/robots.txt`, `/sitemap.xml` | Contain the **new** domain |
| Any unknown path | Custom 404 page |
| `/#/admin` (full-stack only) | Admin login screen; sign-in works |
| Browser console | No errors, no failed asset requests |
| Mobile (390px) | No horizontal scroll, menu opens |

If the storefront says "demo build", the page was served without a reachable
`/api` — the static host is not talking to the backend. Full-stack hosts serve
both from one origin, so this only happens on static-only platforms.

---

## 7. What about the Vercel files

`frontend/vercel.json` (build/output/rewrite hints) is the only Vercel-specific
file. **It contains no dependency, SDK, or secret**, it is inert on every other
platform, and it is ignored by Netlify, Cloudflare, Render, Docker and GitHub
Pages. It is therefore kept, because deleting it would break your existing
Vercel project if you ever deploy there again.

If you want it gone anyway, one command removes it without touching your
repository history beyond that commit:

```bash
git rm frontend/vercel.json && git commit -m "Drop Vercel config"
```

No other file references Vercel except documentation prose.

---

## 8. Rollback

Every change made for portability is additive: one new build variable
(`SITE_URL`, defaulting to the old address) and one new post-build script. To
return to the previous behaviour, build without `SITE_URL` — the site will
again point at `https://gdfvinnie.github.io/sleekculture`.
