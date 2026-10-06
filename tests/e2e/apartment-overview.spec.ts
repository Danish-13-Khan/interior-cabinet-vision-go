import { expect, test, type Page } from "@playwright/test";
import {
  TOUR_LAUNCH, historyDepths, openThreeBhkIn3d, waitForSaved, webglRenderer,
} from "./showcaseTourHelpers";

/**
 * Phase 8.3 exit gate. Same GPU browser as the tour spec. Frame stalls are
 * asserted only with OVERVIEW_PERF_STRICT=1.
 */
const STRICT = process.env.OVERVIEW_PERF_STRICT === "1";
const STALL_BUDGET_MS = 100;
test.use({ ...TOUR_LAUNCH, ...(process.env.TOUR_PERF_BASE ? { baseURL: process.env.TOUR_PERF_BASE } : {}) });

function percentile(values: number[], fraction: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0);
}

async function orbit(page: Page, box: { x: number; y: number; width: number; height: number }, ms: number) {
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.45;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  const start = Date.now();
  let step = 0;
  while (Date.now() - start < ms) {
    step += 1;
    await page.mouse.move(cx + Math.sin(step) * 36, cy + Math.cos(step) * 20, { steps: 2 });
  }
  await page.mouse.up();
}

test("whole-apartment view orbits without an undo step, then a click enters that room", async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    const frames: number[] = [];
    let last = performance.now();
    const tick = (now: number) => {
      const phase = document.querySelector("[data-testid=lr-model-viewport]")?.getAttribute("data-overview-phase");
      const bucket = phase === "overview" ? "overview" : phase === "idle" ? "room" : "";
      const store = (window as unknown as { __overviewFrames: Record<string, number[]> }).__overviewFrames;
      if (bucket) store[bucket].push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    (window as unknown as { __overviewFrames: Record<string, number[]> }).__overviewFrames = {
      overview: frames, room: [],
    };
    requestAnimationFrame(tick);
  });
  await openThreeBhkIn3d(page);
  await waitForSaved(page);
  const historyBefore = await historyDepths(page);
  const canvas = page.getByTestId("lr-model-canvas-host");
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (box) {
    await page.evaluate(() => { (window as unknown as { __overviewFrames: { room: number[] } }).__overviewFrames.room.length = 0; });
    await orbit(page, box, 1500);
  }
  const roomFrames = await page.evaluate(() => (
    [...(window as unknown as { __overviewFrames: { room: number[] } }).__overviewFrames.room]
  ));
  await page.evaluate(() => { (window as unknown as { __mark: number }).__mark = performance.now(); });
  await page.getByTestId("apartment-overview-toggle").click();
  await expect(page.getByTestId("apartment-overview")).toHaveAttribute("data-overview-phase", "overview", { timeout: 60_000 });
  const coldMs = await page.evaluate(() => performance.now() - (window as unknown as { __mark: number }).__mark);
  await page.getByTestId("apartment-overview-corner-top").click();
  await page.getByTestId("apartment-overview-corner-sw").click();
  await page.evaluate(() => {
    const store = (window as unknown as { __overviewFrames: { overview: number[] }; __orbitFrom: number });
    store.__orbitFrom = store.__overviewFrames.overview.length;
  });
  if (box) await orbit(page, box, 2000);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("lr-model-viewport")).toHaveAttribute("data-overview-phase", "idle", { timeout: 60_000 });
  expect(await historyDepths(page)).toBe(historyBefore);

  await page.evaluate(() => { (window as unknown as { __mark: number }).__mark = performance.now(); });
  await page.getByTestId("apartment-overview-toggle").click();
  await expect(page.getByTestId("apartment-overview")).toHaveAttribute("data-overview-phase", "overview", { timeout: 60_000 });
  const warmMs = await page.evaluate(() => performance.now() - (window as unknown as { __mark: number }).__mark);
  const activeBefore = await page.getByTestId("lr-model-viewport").getAttribute("data-active-room-id");
  let target: { x: number; y: number; roomId: string } | null = null;
  if (box) {
    for (let y = 0.3; y <= 0.7 && !target; y += 0.1) {
      for (let x = 0.3; x <= 0.7 && !target; x += 0.1) {
        const point = { x: box.x + box.width * x, y: box.y + box.height * y };
        await page.mouse.move(point.x, point.y);
        const roomId = (await page.getByTestId("lr-model-viewport").getAttribute("data-overview-room-id")) ?? "";
        if (roomId && roomId !== activeBefore) target = { ...point, roomId };
      }
    }
  }
  expect(target, "a room other than the active one should sit under the cursor").toBeTruthy();
  await page.mouse.click(target!.x, target!.y);
  await expect(page.getByTestId("lr-model-viewport")).toHaveAttribute("data-active-room-id", target!.roomId, { timeout: 60_000 });
  await expect(page.getByTestId("lr-model-viewport")).toHaveAttribute("data-overview-phase", "idle");
  const historyAfter = await historyDepths(page);
  expect(Number(historyAfter.split("/")[0])).toBeGreaterThan(Number(historyBefore.split("/")[0]));

  const sampled = await page.evaluate(() => {
    const store = (window as unknown as { __overviewFrames: { overview: number[] }; __orbitFrom: number });
    return { overview: store.__overviewFrames.overview, orbitFrom: store.__orbitFrom ?? 0 };
  });
  const orbitFrames = sampled.overview.slice(sampled.orbitFrom);
  const maxMs = Math.round(Math.max(0, ...sampled.overview));
  const frameStats = {
    renderer: await webglRenderer(page),
    frames: sampled.overview.length,
    maxMs,
    orbitP95Ms: percentile(orbitFrames, 0.95),
    roomP95Ms: percentile(roomFrames, 0.95),
    coldMs: Math.round(coldMs),
    warmMs: Math.round(warmMs),
  };
  console.log(`overview-frames ${JSON.stringify(frameStats)}`);
  test.info().annotations.push({ type: "overview-frames", description: JSON.stringify(frameStats) });
  if (STRICT) expect(maxMs).toBeLessThan(STALL_BUDGET_MS);
});
