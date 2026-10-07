#!/usr/bin/env node
/**
 * Marketing / project-home card images for apartment templates, two per
 * template at 800×600 (4:3), each checked for exposure and file size:
 *   - apartment-<slug>-v1.webp       the card: hero room from the Showcase tour, daylight
 *   - apartment-<slug>-plan-v1.webp  the second image: whole-apartment overview (hover / focus)
 *
 *   npm run stills:apartments              # both images, every apartment
 *   npm run stills:apartments -- 3bhk      # one template
 *   npm run stills:apartments -- --hero    # card images only
 *   npm run stills:apartments -- --overview  # plan images only
 *   npm run stills:apartments -- --record-bands
 *
 * Captures at client-preview and device pixel ratio 2 (`?capture=1`).
 * Uses the Metal GPU on macOS and SwiftShader elsewhere (slower, same pixels).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { exposureProblems, formatExposure, readExposure } from "./still-exposure.mjs";
import { STILL_CAPTURE_DPR, applyStillCaptureLook, armTourHeroWatch, waitForSettledFrame, waitForTourHero } from "./stillCaptureQuality.mjs";
import { collectSurfaceProblems, loadSurfaceBands, writeRecordedBands } from "./still-surface-bands.mjs";

const SLUGS = ["studio", "1bhk", "2bhk", "3bhk"];
const OUT_W = 800;
const OUT_H = 600;
const WEBP_QUALITY = 95;
const STILL_MAX_KB = 120;
const SESSION = JSON.stringify({ email: "stills@cabinet.studio", theme: "calm", at: "2026-01-01T00:00:00.000Z" });

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const onlyHero = args.includes("--hero");
const onlyOverview = args.includes("--overview");
const kinds = [
  ...(onlyOverview ? [] : [{ kind: "card", suffix: "v1" }]),
  ...(onlyHero ? [] : [{ kind: "plan", suffix: "plan-v1" }]),
];
const mood = args.find((arg) => arg.startsWith("--mood="))?.slice("--mood=".length) ?? "day";
if (!["day", "evening"].includes(mood)) throw new Error(`--mood must be day or evening, not ${mood}`);
const only = args.filter((arg) => !arg.startsWith("--"));
const slugs = only.length ? SLUGS.filter((slug) => only.includes(slug)) : SLUGS;

/** Centre-crop to 4:3, scale to the card size, read its exposure and encode WebP. */
async function cropToCard(png) {
  const image = await loadImage(png);
  const scale = Math.max(OUT_W / image.width, OUT_H / image.height);
  const sw = OUT_W / scale;
  const sh = OUT_H / scale;
  const canvas = createCanvas(OUT_W, OUT_H);
  const context = canvas.getContext("2d");
  context.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, 0, 0, OUT_W, OUT_H);
  const exposure = readExposure(context.getImageData(0, 0, OUT_W, OUT_H).data);
  return { webp: await canvas.encode("webp", WEBP_QUALITY), exposure };
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

async function openTemplate(page, baseUrl, slug) {
  await page.goto(`${baseUrl}/app?capture=1`);
  await page.getByTestId(`apartment-template-template:apartment:${slug}:v1`).click({ timeout: 90_000 });
}

/** The rig marks the frame settled; give the lights one more beat, then read the canvas. */
async function grabCanvas(page, label) {
  await page.waitForTimeout(300);
  const canvas = page.locator("[data-testid=lr-model-canvas-host] canvas");
  const dataUrl = await canvas.evaluate((element) => element.toDataURL("image/png"));
  const card = await cropToCard(Buffer.from(dataUrl.split(",")[1], "base64"));
  const surfaces = await collectSurfaceProblems(page, label, surfaceBands, recordBands);
  return { ...card, surfaces };
}

/** Whole-apartment view from the default high corner (the card's second image). */
async function captureOverview(page, baseUrl, slug) {
  await openTemplate(page, baseUrl, slug);
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await page.getByTestId("lr-model-viewport").waitFor({ timeout: 60_000 });
  await fitCanvasToCard(page);
  await applyStillCaptureLook(page, mood);
  await page.getByTestId("apartment-overview-toggle").click();
  await page.getByTestId("apartment-overview").and(page.locator('[data-overview-phase="overview"]')).waitFor({ timeout: 90_000 });
  await waitForSettledFrame(page);
  return grabCanvas(page, `apartment-${slug}-plan-v1`);
}

/** Hero room via Present + tour: stop 0 is the overview, stop 1 the hero room (the card image). */
async function captureHero(page, baseUrl, slug) {
  await openTemplate(page, baseUrl, slug);
  await page.getByTestId("interiors-present").click();
  await page.locator(".lr-model-viewport.is-client-presentation").waitFor({ timeout: 60_000 });
  await fitCanvasToCard(page);
  await applyStillCaptureLook(page, mood);
  await armTourHeroWatch(page);
  await page.getByTestId("showcase-tour-toggle").click();
  await page.getByTestId(`showcase-tour-mood-${mood}`).click();
  await waitForTourHero(page);
  const card = await grabCanvas(page, `apartment-${slug}-v1`);
  await page.keyboard.press("Escape");
  return card;
}

const server = await createServer({ root, server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
await server.listen();
const address = server.httpServer?.address();
const port = typeof address === "object" && address ? address.port : 1420;
const gpu = process.platform === "darwin";
const browser = await chromium.launch(gpu
  ? { channel: "chromium", args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] }
  : { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

const recordBands = args.includes("--record-bands");
const surfaceBands = recordBands ? null : await loadSurfaceBands(root);
const failures = [];
try {
  for (const slug of slugs) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: STILL_CAPTURE_DPR,
    });
    await context.addInitScript(({ session, dpr }) => {
      window.localStorage.clear();
      window.localStorage.setItem("cabinetStudioSession", session);
      window.localStorage.setItem("cabinet-designer:3d-guide:j1", "dismissed");
      Object.defineProperty(window, "devicePixelRatio", { get: () => dpr, configurable: true });
    }, { session: SESSION, dpr: STILL_CAPTURE_DPR });
    for (const { kind, suffix } of kinds) {
      const page = await context.newPage();
      const capture = kind === "card" ? captureHero : captureOverview;
      const { webp, exposure, surfaces } = await capture(page, `http://127.0.0.1:${port}`, slug);
      const output = join(root, "public", "catalog", "templates", `apartment-${slug}-${suffix}.webp`);
      const kb = Math.round(webp.length / 1024);
      const problems = [];
      if (kb > STILL_MAX_KB) problems.push(`${slug} ${kind}: ${kb} KB exceeds ${STILL_MAX_KB} KB`);
      for (const problem of exposureProblems(exposure)) problems.push(`${slug} ${kind}: ${problem}`);
      problems.push(...surfaces.map((problem) => `${slug} ${kind}: ${problem}`));
      if (problems.length) {
        failures.push(...problems);
        console.error(`${slug} ${kind} left the previous file in place — ${formatExposure(exposure)}:\n  ${problems.join("\n  ")}`);
      } else {
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, webp);
        console.log(`${slug} ${kind}: ${output} (${kb} KB) — ${formatExposure(exposure)}`);
      }
      await page.close();
    }
    await context.close();
  }
  if (recordBands) {
    const written = await writeRecordedBands(root);
    if (written) console.log(`Wrote ${written}`);
  }
} finally {
  await browser.close();
  await server.close();
}
if (failures.length) {
  console.error(`Stills out of range:\n  ${failures.join("\n  ")}`);
  process.exitCode = 1;
}
