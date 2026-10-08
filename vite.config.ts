import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const githubPages = process.env.GITHUB_PAGES === "true";
// Custom domain (modumitrasoftware.com) and apex Pages need root asset paths.
// Project URL https://<user>.github.io/<repo>/ still works if Pages custom domain is set,
// because GitHub redirects that host to the custom domain.
const pagesBase = "/";

// @gltf-transform/core (NodeIO) and libredwg-web's Emscripten loader import
// these only behind Node-environment checks. Marking them external skips
// Vite's "externalized for browser compatibility" warning; the branch never runs.
const nodeOnlyImports = ["node:fs", "node:path", "module"];

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  worker: {
    rollupOptions: {
      external: nodeOnlyImports,
    },
  },
  resolve: {
    dedupe: ["three"],
  },
  base: githubPages ? pagesBase : "/",
  optimizeDeps: {
    exclude: ["@napi-rs/canvas", "pdfjs-dist"],
    // Deps only reached at runtime (DWG + model-import workers, save/export
    // paths). Discovering one mid-session makes Vite re-optimize and reload
    // every open page, which strands an e2e run on a fresh dev server.
    include: [
      "@mlightcad/libredwg-web",
      "fflate",
      "jspdf",
      "meshoptimizer",
      "@gltf-transform/core",
      "@gltf-transform/extensions",
      "@gltf-transform/functions",
      "three/examples/jsm/exporters/GLTFExporter.js",
      "three/examples/jsm/libs/meshopt_decoder.module.js",
      "three/examples/jsm/loaders/DRACOLoader.js",
      "three/examples/jsm/loaders/FBXLoader.js",
      "three/examples/jsm/loaders/GLTFLoader.js",
      "three/examples/jsm/loaders/MTLLoader.js",
      "three/examples/jsm/loaders/OBJLoader.js",
    ],
  },
  test: {
    // Playwright owns browser specs; importing them in Vitest throws before collection.
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      external: ["@napi-rs/canvas", ...nodeOnlyImports],
      output: {
        manualChunks(id) {
          // Shared loader helpers must not pull PDF/export code into the homepage.
          if (id.includes("vite/preload-helper") || id.includes("commonjsHelpers")) {
            return "runtime-helpers";
          }
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

          // Core only: examples/jsm loaders and exporters follow their lazy importers.
          if (id.includes("/three/") && !id.includes("/three/examples/")) {
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
