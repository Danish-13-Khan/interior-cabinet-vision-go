import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { geminiFloorplanProxyPlugin } from "./scripts/gemini-floorplan/viteGeminiProxyPlugin";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const githubPages = process.env.GITHUB_PAGES === "true";
// Repo name for project Pages URL: https://<user>.github.io/<repo>/
const pagesBase = "/interior-cabinet-vision-go/";

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), geminiFloorplanProxyPlugin()],
  resolve: {
    dedupe: ["three"],
  },
  base: githubPages ? pagesBase : "/",
  optimizeDeps: {
    exclude: ["@napi-rs/canvas", "pdfjs-dist"],
  },
  test: {
    // Playwright owns browser specs; importing them in Vitest throws before collection.
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      external: ["@napi-rs/canvas"],
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/")
          ) {
            return "react-vendor";
          }

          if (id.includes("/three/")) {
            return "three-core";
          }

          if (id.includes("@react-three/fiber")) {
            return "r3f-vendor";
          }

          if (id.includes("@react-three/drei")) {
            return "drei-vendor";
          }

          if (id.includes("/jspdf/")) {
            return "jspdf-vendor";
          }

          if (id.includes("html2canvas") || id.includes("dompurify")) {
            return "export-helpers";
          }

          if (id.includes("@tauri-apps/")) {
            return "tauri-vendor";
          }

          return undefined;
        },
      },
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
