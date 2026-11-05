import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Frontend build.
//
// Default base is "/" — correct for most hosts (Netlify, Vercel, Render,
// PythonAnywhere, Netlify drop…).
//
// GitHub Pages *project* sites serve the site from "/<repo-name>/". Build
// with:
//     BASE_PATH=/<repo-name> npm run build
// so every asset URL matches. GitHub Actions does this automatically.
//
// Dev server: API calls (/api) are proxied to the Python backend on 3001.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || "/",
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
