import { expect, test } from "@playwright/test";
import { COMPOSER_TEST_NOW } from "../../src/domain/apartmentTemplates/composers/bareRoom";
import { instantiateApartmentTemplate } from "../../src/domain/apartmentTemplates/instantiateApartmentTemplate";
import { showcaseTourStops } from "../../src/domain/apartmentTemplates/showcaseTour";
import {
  THREE_BHK_ID, TOUR_LAUNCH, expectTourStopped, installTourProbe, openThreeBhkIn3d,
  historyDepths, readTourProbe, resetTourProbe, saveStateUnchanged, startTour, tour, waitForSaved, webglRenderer,
} from "./showcaseTourHelpers";

/**
 * Phase 7 exit gate. (Model View has no room switcher on screen, so the
 * room-switch stop is covered by showcaseTourSession.test.ts.) Frame budget is enforced with TOUR_PERF_STRICT=1,
 * and only means something against a production build on a GPU:
 *   npm run build && npx vite preview --host 127.0.0.1 --port 4173
 *   TOUR_PERF_STRICT=1 TOUR_PERF_BASE=http://127.0.0.1:4173 npx playwright test tests/e2e/apartment-showcase-tour.spec.ts
 * Without TOUR_PERF_BASE the run uses the dev server (unminified React, dev
 * checks), whose frames are not representative. Otherwise the numbers are
 * reported only, because software GL (SwiftShader) cannot hold 100 ms frames.
 */
const STRICT = process.env.TOUR_PERF_STRICT === "1";
const STALL_BUDGET_MS = 100;
test.use({ ...TOUR_LAUNCH, ...(process.env.TOUR_PERF_BASE ? { baseURL: process.env.TOUR_PERF_BASE } : {}) });

const EXPECTED_STOPS = showcaseTourStops(instantiateApartmentTemplate(THREE_BHK_ID, { now: COMPOSER_TEST_NOW }))
  .map((stop) => stop.roomName);

test("3 BHK tour visits every room in order, glides without stalls, and adds no undo step", async ({ page }) => {
  test.setTimeout(240_000);
  await installTourProbe(page);
  await openThreeBhkIn3d(page);
  await waitForSaved(page);
  const historyBefore = await historyDepths(page);
  expect(historyBefore).toMatch(/^\d+\/\d+$/);
  await resetTourProbe(page);
  await startTour(page);
  await expect(tour(page)).toHaveAttribute("data-tour-active", "0", { timeout: 120_000 });
  await expect(tour(page)).toHaveAttribute("data-tour-stop-reason", "finished");

  const probe = await readTourProbe(page);
  expect(probe.rooms).toEqual(EXPECTED_STOPS);
  const touringFrames = probe.frames.filter((frame) => frame.phase === "touring");
  const touring = touringFrames.map((frame) => frame.dt);
  const worst = touringFrames.reduce((max, frame) => (frame.dt > max.dt ? frame : max), { dt: 0, stop: "" });
  const preparing = probe.frames.filter((frame) => frame.phase === "preparing").map((frame) => frame.dt);
  const sorted = [...touring].sort((a, b) => a - b);
  const stats = {
    renderer: await webglRenderer(page),
    frames: touring.length,
    maxMs: Math.round(Math.max(...touring)),
    p95Ms: Math.round(sorted[Math.floor(sorted.length * 0.95)] ?? 0),
    over100: touring.filter((dt) => dt > STALL_BUDGET_MS).length,
    worstStop: worst.stop,
    stallStops: [...new Set(touringFrames.filter((frame) => frame.dt > STALL_BUDGET_MS).map((frame) => frame.stop))],
    preRollMs: Math.round(preparing.reduce((sum, dt) => sum + dt, 0)),
    preRollMaxMs: Math.round(Math.max(0, ...preparing)),
  };
  test.info().annotations.push({ type: "tour-frames", description: JSON.stringify(stats) });
  expect(touring.length).toBeGreaterThan(EXPECTED_STOPS.length * 60);
  if (STRICT) expect(stats.maxMs, `longest frame at stop ${stats.worstStop}; stalls at ${stats.stallStops.join(", ")}`).toBeLessThan(STALL_BUDGET_MS);

  // View-only: undo/redo stacks identical, never dirty, never autosaved during the tour.
  expect(await historyDepths(page)).toBe(historyBefore);
  expect(saveStateUnchanged(probe.saveLabels), probe.saveLabels.join(" | ")).toBe(true);
});

test("Escape, canvas input, Fit Room, F, camera menu and leaving 3D stop the tour; mood stays view-only", async ({ page }) => {
  test.setTimeout(240_000);
  await installTourProbe(page);
  await openThreeBhkIn3d(page);
  await waitForSaved(page);
  const historyBefore = await historyDepths(page);
  const canvas = page.getByTestId("lr-model-canvas-host");
  const box = (await canvas.boundingBox())!;
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await startTour(page);
  await page.keyboard.press("Escape");
  await expectTourStopped(page, "escape");

  await startTour(page);
  await page.mouse.click(centre.x, centre.y);
  await expectTourStopped(page, "canvas");

  await startTour(page);
  await page.mouse.move(centre.x, centre.y);
  await page.mouse.down();
  await page.mouse.move(centre.x + 120, centre.y + 20, { steps: 6 });
  await page.mouse.up();
  await expectTourStopped(page, "canvas");

  await startTour(page);
  await page.mouse.move(centre.x, centre.y);
  await page.mouse.wheel(0, 240);
  await expectTourStopped(page, "canvas");

  // Camera commands outside the canvas take the camera back too.
  await startTour(page);
  await page.getByTestId("model-fit-room").click();
  await expectTourStopped(page, "user");

  await startTour(page);
  await canvas.focus();
  await page.keyboard.press("f");
  await expectTourStopped(page, "user");

  await startTour(page);
  await page.getByTestId("model-view-settings").getByRole("button").first().click();
  const cameraMenu = page.getByTestId("model-view-settings").getByRole("combobox", { name: /^Camera/ });
  const otherCamera = await cameraMenu.locator("option").last().getAttribute("value");
  await cameraMenu.selectOption(otherCamera!);
  await expectTourStopped(page, "user");
  await page.keyboard.press("Escape");

  // Mood: the tour's Day/Evening toggle changes the view only.
  await resetTourProbe(page);
  await startTour(page);
  const evening = page.getByTestId("showcase-tour-mood-evening");
  const day = page.getByTestId("showcase-tour-mood-day");
  const target = (await evening.getAttribute("aria-pressed")) === "true" ? day : evening;
  await target.click();
  await expect(target).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(2500); // longer than the 1.5 s autosave debounce
  await expect(tour(page)).toHaveAttribute("data-tour-active", "1");
  await page.keyboard.press("Escape");
  await expectTourStopped(page, "escape");
  const probe = await readTourProbe(page);
  expect(saveStateUnchanged(probe.saveLabels), probe.saveLabels.join(" | ")).toBe(true);
  expect(await historyDepths(page)).toBe(historyBefore);

  // Leaving 3D unmounts Model View; coming back finds the tour stopped.
  await startTour(page);
  await page.getByRole("button", { name: "2D plan", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toHaveCount(0);
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(tour(page)).toHaveAttribute("data-tour-active", "0");
  expect(await historyDepths(page)).toBe(historyBefore);

});
