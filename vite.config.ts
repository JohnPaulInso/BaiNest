import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// (2026-07-13) Dynamic base for GitHub Pages and local dev. Prev: ./ base
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/BaiNest/" : "/",
  plugins: [react()],
  server: { host: "0.0.0.0", port: 3000, strictPort: true },
  build: { outDir: "dist", sourcemap: false },
});
