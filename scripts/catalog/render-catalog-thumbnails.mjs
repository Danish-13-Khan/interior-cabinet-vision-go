#!/usr/bin/env node
/**
 * Render parametric cabinet thumbnails through the product node renderer.
 * Starts Vite, opens `/?catalog-thumb=<id>` per catalogue cabinet and writes
 * public/catalog/items/<id>.png.
 *
 *   npm run catalog:render
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const server = await createServer({ root, server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
await server.listen();
const address = server.httpServer?.address();
const port = typeof address === "object" && address ? address.port : 1420;
const base = `http://127.0.0.1:${port}/`;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

try {
  const page = await browser.newPage({ viewport: { width: 520, height: 380 } });
  await page.goto(`${base}?catalog-thumb=`, { waitUntil: "networkidle" });
  const list = JSON.parse(await page.locator("#catalog-thumb-list").innerText({ timeout: 60_000 }));
  await mkdir(join(root, "public", "catalog", "items"), { recursive: true });
  for (const { id, file } of list) {
    await page.goto(`${base}?catalog-thumb=${encodeURIComponent(id)}`, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-catalog-thumb-ready="true"]', { timeout: 60_000 });
    await page.waitForTimeout(1200);
    await page.locator(".catalog-thumbnail-stage").screenshot({ path: join(root, "public", file) });
    console.log(`thumbnail ${file}`);
  }
} finally {
  await browser.close();
  await server.close();
}
