import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Frontend build.
//
// Two settings make the same source deployable anywhere:
//
//   BASE_PATH  Where the site is served FROM. Default "/". Use "/<repo-name>"
//              for GitHub Pages project sites, or a sub-folder on any host.
//
//   SITE_URL   The public address of the site, used for canonical/SEO/social
//              tags, robots.txt and sitemap.xml. Include the sub-path when the
//              site is not at the domain root, e.g.
//                  SITE_URL=https://sleekculture.ng
//                  SITE_URL=https://user.github.io/repo
//              It is baked in at build time — rebuild after a domain change.
//              The default keeps the current GitHub Pages deployment working.
//
// Dev server: API calls (/api) are proxied to the Python backend on 3001.
const SITE_URL = (process.env.SITE_URL || "https://gdfvinnie.github.io/sleekculture").replace(
  /\/+$/,
  ""
);

/** Replaces the __SITE_URL__ token in index.html with the configured address. */
function siteUrlPlugin(siteUrl) {
  return {
    name: "sleekculture-site-url",
    transformIndexHtml(html) {
      return html.replaceAll("__SITE_URL__", siteUrl);
    },
  };
}

export default defineConfig({
  plugins: [react(), siteUrlPlugin(SITE_URL)],
  // Vite's base must end with a slash: template tokens such as
  // %BASE_URL%sleekculture-logo.png would otherwise produce
  // "/repo" + "logo.png" => "/repologo.png" (broken favicon/og:image).
  base: `${(process.env.BASE_PATH || "/").replace(/\/*$/, "")}/`,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
