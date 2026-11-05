# Publishing sleekculture

The site is a single Python app: Flask serves both the REST API and the
built client on one port. Two deployment paths are documented here:

- **PythonAnywhere (recommended free host)** — Part B
- **Docker / VPS / Railway** — Part C

Data lives in one directory (`data/`): the SQLite database plus uploaded
product images. Wherever it's deployed, that directory is the whole
datastore — back it up.

---

## Part A — Environment variables

Set these in your hosting dashboard (never commit real values — see `.env.example`):

| Variable | Required | Notes |
| --- | --- | --- |
| `ADMIN_EMAIL` | first boot | Seeds the admin user once; ignored afterwards. |
| `ADMIN_PASSWORD` | first boot | Stored as a bcrypt hash, never in plain text. |
| `COOKIE_SECURE` | production | Set to `1` so session cookies require HTTPS. |
| `DATA_DIR` | optional | Where SQLite DB + uploads live. Default: `<project>/data`. |
| `SESSION_TTL_HOURS` / `MAX_LOGIN_ATTEMPTS` / `LOCKOUT_MINUTES` | optional | Sane defaults; rarely changed. |
| `PAYSTACK_SECRET_KEY` | optional | Enables **real** server-side Paystack verification (Part D). Leave unset to keep dev behavior. |

The app loads a project-root `.env` file automatically (real environment
variables win over `.env` values), so on PythonAnywhere the simplest way to
configure is a `.env` file in the project root — Part B shows the exact file.

---

## Part B — Deploy to PythonAnywhere (free plan)

Free-plan limits that matter (current as of Oct 2026):

- 1 web app at `yourusername.pythonanywhere.com` — no custom domains on free
- 512 MB disk quota — code + `data/` fits easily (your data is currently <1 MB)
- Outbound internet goes through a proxy allowlist; **`api.paystack.co` is on
  the default allowlist**, so Paystack verification works. Other hosts need
  a whitelist entry on the account page.
- Free web apps expire after ~3 months of inactivity — you'll get an email;
  one click ("Run until 3 months") extends it.

### Step 1 — Build the frontend on your PC (Node is not on the free tier)

```bash
cd frontend
npm install
npm run build          # creates frontend/dist
```

### Step 2 — Upload the project

1. Zip everything except `node_modules`, `.git`, and `.env`:
   ```bash
   # from the project root (Git Bash / WSL / macOS / Linux)
   zip -r sleekculture.zip backend data frontend/dist frontend/index.html \
       frontend/package.json frontend/vite.config.js frontend/tailwind.config.js \
       frontend/postcss.config.js .env.example
   ```
   Leave `data` out of the zip only if you want a *fresh* store instead of
   carrying over existing products, orders, and images.
2. On PythonAnywhere, upload `sleekculture.zip` via the **Files** tab, then in
   a bash console:
   ```bash
   unzip sleekculture.zip -d ~/sleekculture
   ```

(Git works too: `git clone <your-repo-url> ~/sleekculture` — but note
`.gitignore` excludes `frontend/dist` and `data/`, so the zip route (which
bundles both) is simpler for deployment.)

### Step 3 — Virtualenv + dependencies

```bash
# on PythonAnywhere bash console
mkvirtualenv sleek-env --python=/usr/bin/python3.10
pip install -r ~/sleekculture/backend/requirements.txt
```

### Step 4 — Environment variables

```bash
cat > ~/sleekculture/.env <<'EOF'
ADMIN_EMAIL=jnrvinnie@gmail.com
ADMIN_PASSWORD=<GENERATE-A-NEW-STRONG-PASSWORD-FOR-LIVE-SITE>
COOKIE_SECURE=1
EOF
chmod 600 ~/sleekculture/.env
```

Notes:
- Generate a **unique password for the live site** — don't reuse your local
  admin password. Login → Settings → Admin Account to change it later.
- Seeding only happens on first boot when the admin doesn't exist; it's
  ignored after that.

### Step 5 — Web app setup

1. Dashboard → **Web** → **Add a new web app** → *Manual configuration* →
   **Python 3.10** (don't use a framework launcher — we have our own WSGI).
2. **Code** section:
   - Working directory: `/home/YOURUSER/sleekculture/backend`
   - **WSGI configuration file**: click it and replace the contents with:
     ```python
     import sys
     sys.path.insert(0, "/home/YOURUSER/sleekculture/backend")
     from wsgi import app      # noqa
     ```
     (replace `YOURUSER` with your PythonAnywhere username)
3. **Virtualenv** section: `/home/YOURUSER/.virtualenvs/sleek-env`
4. Click green **Reload** button.

Your site is now live at `https://YOURUSER.pythonanywhere.com`.

### Step 6 — Data carries over (or starts fresh)

If you zipped `data/` in Step 2, your products, uploaded images, orders, and
admin account exist on the live site from the first request. The uploaded
image URLs (`/api/media/...`) resolve against `data/uploads/`, so nothing in
the database needs to change.

PythonAnywhere home directories are **persistent** — the DB and images
survive restarts, reloads, and deploys. No volume configuration needed.

### Health check

- `https://YOURUSER.pythonanywhere.com/api/products` → JSON of your catalog
- `https://YOURUSER.pythonanywhere.com/` → the storefront
- Log in at `/#/admin` (admin login) → Dashboard shows live numbers

---

## Part C — Docker / VPS / Railway

```bash
docker build -t sleekculture .
docker run -p 3001:3001 \
  -e ADMIN_EMAIL=you@example.com \
  -e ADMIN_PASSWORD=change-me \
  -e COOKIE_SECURE=1 \
  -v sleekculture-data:/app/data \
  sleekculture
```

Railway CLI:

```bash
npx @railway/cli login && npx @railway/cli init
npx @railway/cli up --detach
npx @railway/cli variables --set ADMIN_EMAIL=... ADMIN_PASSWORD=... COOKIE_SECURE=1
npx @railway/cli volume add --mount-path /app/data
npx @railway/cli domain
```

VPS (no Docker): point gunicorn/waitress at the WSGI entry:

```bash
waitress-serve --host 0.0.0.0 --port 3001 wsgi:app    # from backend/
```

---

## Part D — Paystack notes

**Card checkout today** (no `PAYSTACK_SECRET_KEY` set): "Card" checkout calls
`POST /api/orders/<id>/verify-payment`, which currently marks a pending order
paid locally. That's the pre-existing dev behavior — convenient for testing,
not a real gateway, and unchanged by this deployment prep unless you set the
key.

**To enable real server-side verification**:

1. Set `PAYSTACK_SECRET_KEY=sk_live_...` in the environment (PythonAnywhere:
   add the line to the `.env` file, then Reload the web app).
2. The backend then calls
   `GET https://api.paystack.co/transaction/verify/<reference>` with your
   secret key before flipping the order to `paid` — failed payments and
   amount mismatches are rejected with HTTP 402, and nothing is stored if
   Paystack can't be reached.
3. Outbound access: on PythonAnywhere free accounts `api.paystack.co` is on
   the default proxy allowlist, so no whitelist change is needed today. If
   you later add another third-party API, request it via the PythonAnywhere
   allowlist page.

The secret key is read from the environment only — it is never committed,
never served, and never logged.

---

## Part E — Backups (set up once live)

The `data/` directory is the entire datastore. Back it up on a schedule.

Save as `~/backup.sh` on PythonAnywhere (or your VPS), and add a cron job:

```bash
#!/usr/bin/env bash
# Reliable SQLite snapshot while the app is running
# cron example: 0 3 * * * /bin/bash /home/YOURUSER/BACKUPSCRIPT >> $HOME/backup.log 2>&1
SRC="/home/YOURUSER/sleekculture/data"
DEST="$HOME/backups"
mkdir -p "$DEST"
python3 - "$SRC/sleekculture.db" "$DEST/sleekculture-$(date +%F).db" <<'PYEOF'
import sqlite3, sys
src, dest = sys.argv[1], sys.argv[2]
s = sqlite3.connect(src)
d = sqlite3.connect(dest)
s.backup(d); d.close(); s.close()
PYEOF
rsync -a "$SRC/uploads/" "$DEST/uploads/"
find "$DEST" -name 'sleekculture-*.db' -mtime +14 -delete
```

PythonAnywhere free accounts can run one scheduled task — Dashboard → Tasks
→ `Daily /usr/bin/bash /home/YOURUSER/backup.sh`.

Also download copies off the host occasionally (Files tab or `scp`) — a
backup that only lives on the same server is not a real backup.

---

## Health checks after any deploy

- `GET /api/products` → `200` with your catalog JSON
- Root `/` serves the built storefront (HTTP 200 once `frontend/dist` exists)
- `/#/admin` login works; dashboard shows live numbers
