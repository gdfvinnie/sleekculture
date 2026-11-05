import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fallbackProducts } from "./fallbackProducts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, "..", "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, "sleekculture.db"));
db.pragma("journal_mode = WAL");

/* ---------------- Schema ---------------- */

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    admin_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    original_price REAL CHECK (original_price IS NULL OR original_price >= 0),
    category TEXT NOT NULL,
    subcategory TEXT,
    sizes TEXT NOT NULL DEFAULT '[]',
    colors TEXT NOT NULL DEFAULT '[]',
    images TEXT NOT NULL DEFAULT '[]',
    description TEXT NOT NULL DEFAULT '',
    rating REAL NOT NULL DEFAULT 0,
    reviews INTEGER NOT NULL DEFAULT 0,
    is_new INTEGER NOT NULL DEFAULT 0,
    is_trending INTEGER NOT NULL DEFAULT 0,
    in_stock INTEGER NOT NULL DEFAULT 1,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

/* ---------------- Seeding ---------------- */

export async function seed(): Promise<void> {
  // Initial admin from env (falls back to the owner's known credentials).
  const email = (process.env.ADMIN_EMAIL ?? "jnrvinnie@gmail.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Vinnievinnie11";
  const existing = db
    .prepare("SELECT id FROM admin_users WHERE email = ?")
    .get(email);
  if (!existing) {
    const hash = await bcrypt.hash(password, 12);
    db.prepare(
      "INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, 'admin')",
    ).run(email, hash);
    console.log(`[db] seeded admin user: ${email}`);
  }

  // Seed catalog on first run only
  const count = db.prepare("SELECT COUNT(*) AS n FROM products").get() as {
    n: number;
  };
  if (count.n === 0) {
    const insert = db.prepare(`
      INSERT INTO products
        (name, price, original_price, category, subcategory, sizes, colors,
         images, description, rating, reviews, is_new, is_trending,
         in_stock, quantity)
      VALUES
        (@name, @price, @originalPrice, @category, @subcategory, @sizes,
         @colors, @images, @description, @rating, @reviews, @isNew,
         @isTrending, @inStock, @quantity)
    `);
    const insertAll = db.transaction((items: unknown[]) => {
      for (const p of items) insert.run(p);
    });
    insertAll(
      fallbackProducts.map((p) => ({
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        category: p.category,
        subcategory: p.subcategory,
        sizes: JSON.stringify(p.sizes),
        colors: JSON.stringify(p.colors),
        images: JSON.stringify(p.images),
        description: p.description,
        rating: p.rating ?? 0,
        reviews: p.reviews ?? 0,
        isNew: p.isNew ? 1 : 0,
        isTrending: p.isTrending ? 1 : 0,
        inStock: p.inStock ? 1 : 0,
        quantity: p.quantity ?? 0,
      })),
    );
    console.log(`[db] seeded ${fallbackProducts.length} products`);
  }

  console.log("[db] database ready");
}

/* ---------------- Row mappers ---------------- */

export function rowToProduct(row: Record<string, unknown>): ProductDb {
  return {
    id: String(row.id),
    name: String(row.name),
    price: Number(row.price),
    originalPrice: row.original_price == null ? undefined : Number(row.original_price),
    category: String(row.category),
    subcategory: row.subcategory == null ? "" : String(row.subcategory),
    sizes: JSON.parse(String(row.sizes ?? "[]")) as string[],
    colors: JSON.parse(String(row.colors ?? "[]")) as string[],
    images: JSON.parse(String(row.images ?? "[]")) as string[],
    description: row.description == null ? "" : String(row.description),
    rating: row.rating == null ? 0 : Number(row.rating),
    reviews: row.reviews == null ? 0 : Number(row.reviews),
    isNew: Boolean(row.is_new),
    isTrending: Boolean(row.is_trending),
    inStock: Boolean(row.in_stock),
    quantity: row.quantity == null ? 0 : Number(row.quantity),
  };
}

export type ProductDb = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  sizes: string[];
  colors: string[];
  images: string[];
  description: string;
  rating: number;
  reviews: number;
  isNew: boolean;
  isTrending: boolean;
  inStock: boolean;
  quantity: number;
};
