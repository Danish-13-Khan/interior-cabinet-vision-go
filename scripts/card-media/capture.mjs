#!/usr/bin/env node
/**
 * Template card media: v2 stills and optional hover clips.
 *   npm run media:cards
 *   npm run media:cards:clips
 *   npm run media:cards -- studio
 *   npm run media:cards -- --with-clips
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { runClipPass } from "./captureClipPass.mjs";
import { runStillsPass } from "./captureStillsPass.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const catalogOnly = args.includes("--catalog-only");
const apartmentsOnly = args.includes("--apartments-only");
const clipsOnly = args.includes("--clips-only");
const withClips = args.includes("--with-clips") || clipsOnly;
const pick = args.filter((arg) => !arg.startsWith("--"));
const dumpSkipped = args.find((arg) => arg.startsWith("--dump-skipped="))?.slice("--dump-skipped=".length) ?? null;

const server = await createServer({
  root,
  server: { host: "127.0.0.1", port: 0, strictPort: false },
  logLevel: "error",
});
await server.listen();
const port = server.httpServer?.address()?.port ?? 1420;
const baseUrl = `http://127.0.0.1:${port}`;
const gpu = process.platform === "darwin";
const browser = await chromium.launch(gpu
  ? { channel: "chromium", args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] }
  : { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

const failures = [];

try {
  if (!clipsOnly) {
    await runStillsPass({
      browser,
      baseUrl,
      root,
      pick,
      catalogOnly,
      apartmentsOnly,
      failures,
      dumpSkipped,
    });
  }
  if (withClips) {
    // The clip timeline (frame count, fps, path parameter, cross-fade) has one home: the app's TS module.
    const timeline = await server.ssrLoadModule("/src/domain/templateCardsCapture/clipTimeline.ts");
    await runClipPass({
      browser,
      baseUrl,
      root,
      pick,
      catalogOnly,
      apartmentsOnly,
      failures,
      timeline,
    });
  }
} finally {
  await browser.close();
  await server.close();
}
if (failures.length) {
  console.error(`Card media out of range:\n  ${failures.join("\n  ")}`);
  process.exitCode = 1;
}
