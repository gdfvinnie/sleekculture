#!/usr/bin/env node
/**
 * Post-build step: bake the public site address into dist/robots.txt and
 * dist/sitemap.xml.
 *
 * The source files in frontend/public/ contain a `__SITE_URL__` token instead
 * of a real domain, so the same code deploys to any domain or sub-path without
 * editing HTML. Set it at build time:
 *
 *     SITE_URL=https://sleekculture.ng npm run build
 *     SITE_URL=https://user.github.io/repo npm run build
 *
 * Defaults to the current GitHub Pages address so existing builds keep
 * working. Run from the frontend/ directory (the build script does this).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = join(process.cwd(), "dist");
const TOKEN = "__SITE_URL__";
const DEFAULT_SITE_URL = "https://gdfvinnie.github.io/sleekculture";

let siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).trim().replace(/\/+$/, "");

if (!/^https?:\/\/[^/]+/i.test(siteUrl)) {
  console.error(
    `write-site-meta: SITE_URL must be an absolute http(s) URL, got "${siteUrl}".`
  );
  process.exit(1);
}

const files = ["robots.txt", "sitemap.xml"];
let changed = 0;

for (const name of files) {
  const file = join(DIST, name);
  if (!existsSync(file)) {
    console.warn(`write-site-meta: ${name} not found in dist — skipped.`);
    continue;
  }
  const before = readFileSync(file, "utf-8");
  const after = before.replaceAll(TOKEN, siteUrl);
  writeFileSync(file, after);
  changed += 1;
}

// index.html is handled by the Vite plugin; warn if a token slipped through
// so a broken canonical/og:image URL never ships silently.
const indexFile = join(DIST, "index.html");
if (existsSync(indexFile) && readFileSync(indexFile, "utf-8").includes(TOKEN)) {
  console.error("write-site-meta: unresolved __SITE_URL__ token in dist/index.html");
  process.exit(1);
}

console.log(`write-site-meta: ${changed} file(s) written (site url ${siteUrl})`);
