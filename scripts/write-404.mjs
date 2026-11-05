#!/usr/bin/env node
/**
 * Post-build step: generate dist/404.html for GitHub Pages.
 *
 * GitHub Pages serves 404.html for any unknown path (e.g. someone opens
 * /<repo>/shop directly). The app uses hash routing (#/shop), so this page
 * simply redirects the visitor to the app root with the deep link converted
 * to a hash:  /<repo>/shop  →  /<repo>/#/shop
 * Harmless on other hosts (the file is never served).
 *
 * Run from the frontend/ directory after `vite build`. BASE_PATH must match
 * the value used in vite.config.js:
 *     BASE_PATH=/my-repo node ../scripts/write-404.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const indexFile = join(dist, "index.html");

if (!existsSync(indexFile)) {
  console.error("write-404: dist/index.html not found — run `vite build` first.");
  process.exit(1);
}

let base = process.env.BASE_PATH || "/";
if (!base.startsWith("/")) base = "/" + base;
if (!base.endsWith("/")) base = base + "/";

const indexHtml = readFileSync(indexFile, "utf-8");

const redirectScript = `<script>(function(){
  var ROOT=${JSON.stringify(base)};
  var rest=location.pathname;
  if(rest.startsWith(ROOT))rest=rest.slice(ROOT.length);
  rest=rest.replace(/\\/index\\.html$/,"").replace(/^\\/+|\\/+$/g,"");
  if(!rest){location.replace(ROOT);return;}
  location.replace(ROOT+"#/"+rest);
})()</script>`;

writeFileSync(join(dist, "404.html"), indexHtml.replace("<head>", "<head>" + redirectScript));
console.log(`write-404: dist/404.html generated (base ${base})`);
