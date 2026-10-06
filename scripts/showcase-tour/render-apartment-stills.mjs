#!/usr/bin/env node
/**
 * Marketing / project-home thumbnails for the apartment templates, captured
 * from the Showcase tour itself: open each template, enter Present, start the
 * tour, and grab the canvas once the first stop (the hero room) has settled.
 * Writes public/catalog/templates/apartment-<slug>-v1.png (960×720, 4:3; the
 * window is sized so the canvas is already 4:3, the crop only trims rounding).
 *
 *   npm run stills:apartments                 # every apartment, saved mood
 *   npm run stills:apartments -- --mood=day   # force the view-only mood
 *   npm run stills:apartments -- 3bhk         # one template
 *
 * Uses the Metal GPU on macOS and SwiftShader elsewhere (slower, same pixels).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const SLUGS = ["studio", "1bhk", "2bhk", "3bhk"];
const OUT_W = 960;
const OUT_H = 720;
const SESSION = JSON.stringify({ email: "stills@cabinet.studio", theme: "calm", at: "2026-01-01T00:00:00.000Z" });

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const mood = args.find((arg) => arg.startsWith("--mood="))?.slice("--mood=".length) ?? null;
const only = args.filter((arg) => !arg.startsWith("--"));
const slugs = only.length ? SLUGS.filter((slug) => only.includes(slug)) : SLUGS;

/** Centre-crop to 4:3 and scale to the card size. */
async function cropToCard(png) {
  const image = await loadImage(png);
  const scale = Math.max(OUT_W / image.width, OUT_H / image.height);
  const sw = OUT_W / scale;
  const sh = OUT_H / scale;
  const canvas = createCanvas(OUT_W, OUT_H);
  canvas.getContext("2d").drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, 0, 0, OUT_W, OUT_H);
  return canvas.encode("png");
}

/** Resize the window so the 3D canvas itself is 4:3: the still keeps the camera's framing, no side crop. */
async function fitCanvasToCard(page) {
  const host = page.getByTestId("lr-model-canvas-host");
  const box = await host.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) return;
  const width = Math.round(viewport.width - (box.width - (box.height * OUT_W) / OUT_H));
  await page.setViewportSize({ width, height: viewport.height });
  await page.waitForTimeout(300);
}

async function captureStill(page, baseUrl, slug) {
  const templateId = `template:apartment:${slug}:v1`;
  await page.goto(`${baseUrl}/app`);
  await page.getByTestId(`apartment-template-${templateId}`).click({ timeout: 90_000 });
  await page.getByTestId("interiors-present").click();
  await page.locator(".lr-model-viewport.is-client-presentation").waitFor({ timeout: 60_000 });
  await fitCanvasToCard(page);
  const tour = page.getByTestId("showcase-tour");
  await page.getByTestId("showcase-tour-toggle").click();
  if (mood) await page.getByTestId(`showcase-tour-mood-${mood}`).click();
  await tour.and(page.locator('[data-tour-phase="touring"][data-tour-stop-index="0"]')).waitFor({ timeout: 90_000 });
  const canvas = page.locator("[data-testid=lr-model-canvas-host] canvas");
  // The first glide ends with the rig marking the frame settled; give lights one more beat.
  await page.waitForFunction(() => document.querySelector("[data-testid=lr-model-canvas-host] canvas")?.dataset.frameSettled === "1", null, { timeout: 30_000 });
  await page.waitForTimeout(400);
  const dataUrl = await canvas.evaluate((element) => element.toDataURL("image/png"));
  await page.keyboard.press("Escape");
  return cropToCard(Buffer.from(dataUrl.split(",")[1], "base64"));
}

const server = await createServer({ root, server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
await server.listen();
const address = server.httpServer?.address();
const port = typeof address === "object" && address ? address.port : 1420;
const gpu = process.platform === "darwin";
const browser = await chromium.launch(gpu
  ? { channel: "chromium", args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] }
  : { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

try {
  for (const slug of slugs) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    await context.addInitScript((session) => {
      window.localStorage.clear();
      window.localStorage.setItem("cabinetStudioSession", session);
      window.localStorage.setItem("cabinet-designer:3d-guide:j1", "dismissed");
    }, SESSION);
    const page = await context.newPage();
    const png = await captureStill(page, `http://127.0.0.1:${port}`, slug);
    const output = join(root, "public", "catalog", "templates", `apartment-${slug}-v1.png`);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, png);
    console.log(`${slug}: ${output} (${Math.round(png.length / 1024)} KB)`);
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}
