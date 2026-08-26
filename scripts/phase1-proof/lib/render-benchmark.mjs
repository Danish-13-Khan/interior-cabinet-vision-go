import { chromium } from "@playwright/test";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function openBenchmark(page, baseUrl, benchmark) {
  await page.goto(baseUrl);
  await page.getByRole("button", { name: "Interiors" }).click();
  await page.getByRole("dialog", { name: "Start a living room project" }).waitFor();
  await page.getByRole("button", { name: new RegExp(benchmark.homeLabel, "i") }).click();
  await page.locator(".lr-plan-titlebar").waitFor();
  await page.getByRole("button", { name: /FX Render/ }).click();
  await page.locator(".lr-plan-titlebar strong").filter({ hasText: "RENDER · LIVING ROOM" }).waitFor();
  await page.getByTestId("lr-render-live").waitFor();
}

async function render(page) {
  const startedAt = Date.now();
  await page.getByRole("button", { name: "Render Image" }).click();
  await page.waitForSelector(".lr-render-progress", { state: "visible", timeout: 10_000 });
  await page.waitForSelector(".lr-render-progress", { state: "hidden", timeout: 60_000 });
  await page.locator(".lr-render-result img").waitFor({ state: "visible", timeout: 10_000 });
  return Date.now() - startedAt;
}

async function select(page, label) {
  await page.getByRole("button", { name: new RegExp(`^${escapeRegExp(label)}`, "i") }).click();
  await page.waitForTimeout(250);
}

export async function collectSamples({ baseUrl, benchmarks, writeSamples }) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => window.localStorage.clear());
    const samples = [];
    writeSamples(samples);
    for (const benchmark of benchmarks) {
      console.log(`[phase1-latency] benchmark: ${benchmark.homeLabel}`);
      await openBenchmark(page, baseUrl, benchmark);
      for (const camera of benchmark.cameras) {
        console.log(`[phase1-latency] camera: ${camera.frameId} (${camera.name})`);
        await select(page, camera.name);
        for (const [label, quality] of [["Draft", "draft"], ["Client Preview", "client-preview"]]) {
          await select(page, label);
          console.log(`[phase1-latency] warm ${quality}: ${camera.frameId}`);
          await render(page);
          const elapsedMs = await render(page);
          console.log(`[phase1-latency] measured ${quality}: ${camera.frameId} -> ${elapsedMs}ms`);
          samples.push({ frameId: camera.frameId, quality, elapsedMs });
          writeSamples(samples);
        }
      }
    }
    return samples;
  } finally {
    await browser.close();
  }
}
