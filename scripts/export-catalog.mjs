#!/usr/bin/env node
/**
 * Refresh the bundled demo catalog for static deployments.
 *
 * Run while the backend is running locally (python backend/app.py):
 *     cd frontend && node ../scripts/export-catalog.mjs
 *
 * What it does:
 *   1. Fetches the live catalog from the running backend (http://localhost:3001).
 *   2. Rewrites `/api/media/<file>` image URLs to the static-friendly
 *      `/media/<file>` form.
 *   3. Writes frontend/src/data/catalog.json (bundled into the static build).
 *   4. Copies data/uploads into frontend/public/media so product photos ship
 *      with the static bundle.
 *
 * Static demo deployments show this snapshot; run this script again after
 * editing products in the admin panel to refresh the demo.
 */

import { createWriteStream, existsSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const here = join(dirname(fileURLToPath(import.meta.url)));
const repoRoot = join(here, "..");
const frontend = join(repoRoot, "frontend");
const apiBase = process.env.API_BASE || "http://localhost:3001";

async function main() {
  const res = await fetch(`${apiBase}/api/products`);
  if (!res.ok) throw new Error(`API responded ${res.status} — is the backend running?`);
  const products = await res.json();

  for (const p of products) {
    p.images = (p.images || []).map((src) =>
      typeof src === "string" && src.startsWith("/api/media/")
        ? src.replace("/api/media/", "/media/")
        : src
    );
  }

  const dataDir = join(frontend, "src", "data");
  mkdirSync(dataDir, { recursive: true });
  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    join(dataDir, "catalog.json"),
    JSON.stringify(products, null, 1),
    "utf-8"
  );
  console.log(`catalog.json: ${products.length} products written`);

  const uploads = join(repoRoot, "data", "uploads");
  const publicMedia = join(frontend, "public", "media");
  if (existsSync(uploads)) {
    mkdirSync(publicMedia, { recursive: true });
    for (const file of readdirSync(uploads)) copyFileSync(join(uploads, file), join(publicMedia, file));
    console.log(`media: copied ${readdirSync(uploads).length} images → frontend/public/media`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
