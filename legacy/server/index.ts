import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  db,
  seed,
  UPLOADS_DIR,
  rowToProduct,
  type ProductDb,
} from "./db";
import {
  attemptLogin,
  createSession,
  destroySession,
  requireAdmin,
  purgeExpiredSessions,
  type AdminRequest,
} from "./auth";
import {
  registerUserRoutes,
  purgeExpiredUserSessions,
} from "./users";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const CLIENT_DIST = path.join(__dirname, "..", "dist");

await seed();
setInterval(purgeExpiredSessions, 60 * 60 * 1000).unref();
setInterval(purgeExpiredUserSessions, 60 * 60 * 1000).unref();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

/* ---------------- Auth API ---------------- */

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  if (email.length > 254 || password.length > 1024) {
    res.status(400).json({ error: "Invalid email or password." });
    return;
  }

  const ip =
    req.ip ??
    req.socket.remoteAddress ??
    (req.headers["x-forwarded-for"] as string | undefined) ??
    "unknown";

  const result = await attemptLogin(email, password, ip);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  createSession(res, result.adminId);
  const admin = db
    .prepare("SELECT email, role FROM admin_users WHERE id = ?")
    .get(result.adminId) as { email: string; role: string };
  res.json({ admin: { email: admin.email, role: admin.role } });
});

app.post("/api/auth/logout", (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

app.get("/api/auth/me", (req: AdminRequest, res) => {
  const token = req.cookies?.["sc_admin_session"];
  if (!token) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  const crypto_ = crypto;
  const tokenHash = crypto_.createHash("sha256").update(token).digest("hex");
  const row = db
    .prepare(
      `SELECT a.email, a.role, s.expires_at
       FROM admin_sessions s JOIN admin_users a ON a.id = s.admin_id
       WHERE s.token_hash = ?`,
    )
    .get(tokenHash) as
    | { email: string; role: string; expires_at: string }
    | undefined;

  if (!row || new Date(row.expires_at) <= new Date()) {
    res.status(401).json({ error: "Session expired." });
    return;
  }
  res.json({ admin: { email: row.email, role: row.role } });
});

/* ---------------- Customer account API ---------------- */

registerUserRoutes(app);

/* ---------------- Products API ---------------- */

// Public: anyone can read the catalog
app.get("/api/products", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM products ORDER BY id DESC")
    .all() as Record<string, unknown>[];
  res.json(rows.map(rowToProduct));
});

// Public: single product
app.get("/api/products/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  res.json(rowToProduct(row));
});

/* ---- Validation shared by create/update ---- */

interface ValidationError {
  field: string;
  message: string;
}

function validateProductBody(body: Record<string, unknown>): {
  errors: ValidationError[];
  values?: Record<string, unknown>;
} {
  const errors: ValidationError[] = [];
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const name = str(body.name);
  if (name.length < 2)
    errors.push({ field: "name", message: "Product name must be at least 2 characters." });
  if (name.length > 200)
    errors.push({ field: "name", message: "Product name is too long." });

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0)
    errors.push({ field: "price", message: "Price must be a valid non-negative number." });

  let originalPrice: number | null = null;
  if (body.originalPrice !== undefined && body.originalPrice !== null && body.originalPrice !== "") {
    originalPrice = Number(body.originalPrice);
    if (!Number.isFinite(originalPrice) || originalPrice < 0)
      errors.push({ field: "originalPrice", message: "Original price must be a valid non-negative number." });
  }

  const quantity = Number(body.quantity ?? 0);
  if (!Number.isInteger(quantity) || quantity < 0)
    errors.push({ field: "quantity", message: "Quantity must be a non-negative integer." });

  const images = Array.isArray(body.images)
    ? body.images.filter((i): i is string => typeof i === "string" && i.trim() !== "")
    : null;
  if (!images || images.length === 0)
    errors.push({ field: "images", message: "Add at least one product image." });
  if (images && images.length > 8)
    errors.push({ field: "images", message: "Maximum 8 images per product." });

  const sizes = Array.isArray(body.sizes)
    ? body.sizes.filter((s): s is string => typeof s === "string" && s.trim() !== "")
    : null;
  if (!sizes || sizes.length === 0)
    errors.push({ field: "sizes", message: "Add at least one size." });

  const colors = Array.isArray(body.colors)
    ? body.colors.filter((c): c is string => typeof c === "string" && c.trim() !== "")
    : null;
  if (!colors || colors.length === 0)
    errors.push({ field: "colors", message: "Add at least one color." });

  const category = str(body.category) || "Hoodies";
  const subcategory = str(body.subcategory);
  const description = str(body.description).slice(0, 5000);
  const inStock = Boolean(body.inStock);
  const isNew = Boolean(body.isNew);
  const isTrending = Boolean(body.isTrending);

  if (errors.length > 0) return { errors };

  return {
    errors,
    values: {
      name,
      price,
      originalPrice,
      category,
      subcategory,
      quantity,
      inStock: inStock ? 1 : 0,
      isNew: isNew ? 1 : 0,
      isTrending: isTrending ? 1 : 0,
      sizes: JSON.stringify(sizes),
      colors: JSON.stringify(colors),
      images: JSON.stringify(images),
      description,
    },
  };
}

// Admin-only: create
app.post("/api/products", requireAdmin, (req: AdminRequest, res) => {
  const { errors, values } = validateProductBody(req.body ?? {});
  if (errors.length > 0 || !values) {
    res.status(400).json({ errors });
    return;
  }
  const info = db
    .prepare(
      `INSERT INTO products
        (name, price, original_price, category, subcategory, quantity,
         in_stock, is_new, is_trending, sizes, colors, images, description)
       VALUES
        (@name, @price, @originalPrice, @category, @subcategory, @quantity,
         @inStock, @isNew, @isTrending, @sizes, @colors, @images, @description)`
    )
    .run(values);
  const row = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(info.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json(rowToProduct(row));
});

// Admin-only: update
app.put("/api/products/:id", requireAdmin, (req: AdminRequest, res) => {
  const existing = db
    .prepare("SELECT id FROM products WHERE id = ?")
    .get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  const { errors, values } = validateProductBody(req.body ?? {});
  if (errors.length > 0 || !values) {
    res.status(400).json({ errors });
    return;
  }
  db.prepare(
    `UPDATE products SET
      name=@name, price=@price, original_price=@originalPrice,
      category=@category, subcategory=@subcategory, quantity=@quantity,
      in_stock=@inStock, is_new=@isNew, is_trending=@isTrending,
      sizes=@sizes, colors=@colors, images=@images, description=@description
     WHERE id=@id`
  ).run({ ...values, id: req.params.id });
  const row = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(req.params.id) as Record<string, unknown>;
  res.json(rowToProduct(row));
});

// Admin-only: delete
app.delete("/api/products/:id", requireAdmin, (req: AdminRequest, res) => {
  const info = db
    .prepare("DELETE FROM products WHERE id = ?")
    .run(req.params.id);
  if (info.changes === 0) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  res.json({ ok: true });
});

/* ---------------- Secure image upload ---------------- */

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 8);
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error("UNALLOWED_FILE_TYPE"));
  },
});

app.post("/api/upload", requireAdmin, upload.array("images", 6), (req, res) => {
  const files = (req.files ?? []) as Express.Multer.File[];
  const urls = files.map(
    (f) => `/api/media/${path.basename(f.path)}`,
  );
  res.status(201).json({ urls });
});

app.get("/api/media/:file", (req, res) => {
  const file = path.basename(req.params.file); // block path traversal
  const ext = path.extname(file).toLowerCase();
  if (!".jpg.jpeg.png.webp.avif".includes(ext) || ext === "") {
    res.status(404).json({ error: "Not found." });
    return;
  }
  const full = path.join(UPLOADS_DIR, file);
  if (!fs.existsSync(full)) {
    res.status(404).json({ error: "Not found." });
    return;
  }
  res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
  res.sendFile(full);
});

// Multer error handling (payload too large, bad file type…)
app.use(
  (
    err: NodeJS.ErrnoException & { code?: string; message?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "Each image must be 2MB or smaller." });
      return;
    }
    if (err.message === "UNALLOWED_FILE_TYPE") {
      res.status(415).json({ error: "Only JPEG, PNG, WebP, or AVIF images are allowed." });
      return;
    }
    console.error("[server]", err.message);
    res.status(500).json({ error: "Internal server error." });
  },
);

/* ---------------- Production static serving ---------------- */

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^\/(?!api|media).*/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[server] sleekculture API + app on http://localhost:${PORT}`);
});
