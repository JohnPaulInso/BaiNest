import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// (2026-07-13) Set root base path for custom domain. Prev: /BaiNest/
export default defineConfig({
  base: "/",
  plugins: [react()],
  server: { host: "0.0.0.0", port: 3000, strictPort: true },
  build: { outDir: "dist", sourcemap: false },
});
