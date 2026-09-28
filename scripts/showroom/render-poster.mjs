#!/usr/bin/env node
/**
 * Render the homepage showroom poster from the same three.js scene the hero plays.
 * Starts a Vite dev server, opens `/?showroom=poster`, waits for the first WebGL frame,
 * and screenshots the stage to public/marketing/showroom-poster.png.
 *
 *   npm run poster:showroom
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const output = join(root, "public", "marketing", "showroom-poster.png");

const server = await createServer({ root, server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
await server.listen();
const address = server.httpServer?.address();
const port = typeof address === "object" && address ? address.port : 1420;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  await page.addInitScript(() => localStorage.setItem("cabinet-studio-showroom-palette", "oak"));
  await page.goto(`http://127.0.0.1:${port}/?showroom=poster`, { waitUntil: "networkidle" });
  await page.waitForSelector('.cs-showroom[data-showroom-ready="true"]', { timeout: 60_000 });
  await page.waitForTimeout(500);
  await mkdir(dirname(output), { recursive: true });
  await page.locator(".cs-showroom-stage").screenshot({ path: output, animations: "disabled" });
  console.log(`Showroom poster written to ${output}`);
} finally {
  await browser.close();
  await server.close();
}
