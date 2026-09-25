import { expect, test, type Page } from "@playwright/test";
import { loadReleaseDemo, openQaRenderStudio, openInteriorsHome } from "./plannerStart";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SHOT_DIR = join("test-results", "render-qa");

async function openReleaseDemo(page: Page) {
  await openInteriorsHome(page);
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeVisible();
  await loadReleaseDemo(page);
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Living Room Release Demo");
}

async function goView(page: Page, view: "plan" | "model" | "render") {
  if (view === "render") {
    await openQaRenderStudio(page);
    return;
  }
  const guide = page.getByRole("button", { name: "Close 3D guide" });
  if (await guide.isVisible().catch(() => false)) await guide.click();
  await page.getByRole("button", { name: view === "plan" ? "2D plan" : "3D", exact: true }).click();
  const title = view === "plan" ? "Room plan" : "3D model";
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText(title);
}

async function sampleWebglCanvas(page: Page, rootTestId: string) {
  await page.waitForSelector(`[data-testid="${rootTestId}"] canvas`, { timeout: 20_000 });
  // Allow the first WebGL frame + lighting to settle.
  await page.waitForTimeout(1800);
  return page.evaluate(async (testId) => {
    const root = document.querySelector(`[data-testid="${testId}"]`);
    const canvas = root?.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      return { ok: false, reason: "canvas-missing", coverage: 0 };
    }
    const width = Math.min(canvas.width || 0, 128);
    const height = Math.min(canvas.height || 0, 128);
    if (width < 8 || height < 8) {
      return { ok: false, reason: "canvas-too-small", coverage: 0, width, height };
    }
    const probe = document.createElement("canvas");
    probe.width = width;
    probe.height = height;
    const probeCtx = probe.getContext("2d");
    if (!probeCtx) return { ok: false, reason: "probe-context-missing", coverage: 0 };
    probeCtx.drawImage(canvas, 0, 0, width, height);
    const { data } = probeCtx.getImageData(0, 0, width, height);
    let nonblank = 0;
    const pixelCount = width * height;
    for (let i = 0; i < pixelCount; i += 1) {
      const o = i * 4;
      const y = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
      if (data[o + 3] >= 8 && y > 8) nonblank += 1;
    }
    const coverage = nonblank / pixelCount;
    const corner = 0.2126 * data[0] + 0.7152 * data[1] + 0.0722 * data[2];
    const cols = 8;
    const rows = 8;
    let occupied = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x0 = Math.floor((col * width) / cols);
        const x1 = Math.floor(((col + 1) * width) / cols);
        const y0 = Math.floor((row * height) / rows);
        const y1 = Math.floor(((row + 1) * height) / rows);
        let sum = 0;
        let count = 0;
        for (let y = y0; y < y1; y += 2) {
          for (let x = x0; x < x1; x += 2) {
            const o = (y * width + x) * 4;
            sum += 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
            count += 1;
          }
        }
        if (count > 0 && Math.abs(sum / count - corner) > 18) occupied += 1;
      }
    }
    const geometryCoverage = occupied / (cols * rows);
    return {
      ok: coverage >= 0.001 && geometryCoverage >= 0.12,
      coverage,
      geometryCoverage,
      reason: geometryCoverage >= 0.12 ? null : "grid-or-background-only",
      width,
      height,
    };
  }, rootTestId);
}

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

test("render QA smoke: Plan / Model / Render Studio screenshots stay nonblank", async ({ page }) => {
  test.setTimeout(90_000);
  await openReleaseDemo(page);

  await expect(page.getByTestId("lr-plan-canvas")).toBeVisible();
  await expect(page.locator(".lr-plan-svg .lr-plan-object").first()).toBeVisible();
  await page.screenshot({ path: join(SHOT_DIR, "plan.png"), fullPage: false });

  await goView(page, "model");
  const model = page.getByTestId("lr-model-viewport");
  await expect(model).toBeVisible();
  await expect.poll(async () => Number(await model.getAttribute("data-scene-height-mm"))).toBeGreaterThan(400);
  await expect.poll(async () => Number(await model.getAttribute("data-extruded-walls"))).toBeGreaterThan(0);
  const modelSample = await sampleWebglCanvas(page, "lr-model-viewport");
  expect(modelSample.ok, `model canvas lacks room geometry: ${JSON.stringify(modelSample)}`).toBe(true);
  await page.screenshot({ path: join(SHOT_DIR, "model.png"), fullPage: false });

  await goView(page, "render");
  await expect(page.getByTestId("lr-render-live")).toBeVisible();
  const renderSample = await sampleWebglCanvas(page, "lr-render-live");
  expect(renderSample.ok, `render canvas blank: ${JSON.stringify(renderSample)}`).toBe(true);
  await page.screenshot({ path: join(SHOT_DIR, "render-studio.png"), fullPage: false });

  const diagnostics = page.getByTestId("render-diagnostics");
  if (await diagnostics.count()) {
    await expect(diagnostics.first()).toContainText("Render Diagnostics");
  }
});

test("render QA smoke: missing GLB/HDRI do not crash Model or Render Studio", async ({ page }) => {
  test.setTimeout(60_000);
  await openReleaseDemo(page);
  await goView(page, "model");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();

  await page.route("**/models/soft-goods/**", (route) => route.abort());
  await page.route("**/environments/**", (route) => route.abort());

  await goView(page, "plan");
  await goView(page, "model");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".lr-model-viewport canvas")).toBeVisible();

  await goView(page, "render");
  await expect(page.getByTestId("lr-render-live")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Render Image" })).toBeVisible();
});
