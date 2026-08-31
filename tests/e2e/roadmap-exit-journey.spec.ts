import { expect, test } from "@playwright/test";
import {
  clickWallMidpoint,
  longestRoomWallId,
  placeNewSingleDoor,
  pointOnPaper,
} from "./roadmap-exit-journey.helpers";

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";

/**
 * Roadmap §7 one-session exit journey:
 * footprint → Draw Wall split → openings/rename → freeform room + cabinet run → 3D → schedule + client package.
 */
test("Exit journey: footprint → split → run → 3D → schedule + client package", async ({ page }) => {
  test.setTimeout(240_000);
  await page.addInitScript((key) => {
    window.localStorage.clear();
    window.localStorage.setItem(key, "dismissed");
  }, GUIDE_KEY);
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();

  // 1–2. Footprint exists; split into ≥2 rooms with Draw Wall.
  await page.locator('[data-build-tool="draw-wall"]').click();
  const paper = page.getByRole("application", { name: "Living room plan editor" });
  const start = await pointOnPaper(paper, 0.5, 850 / 6300);
  const end = await pointOnPaper(paper, 0.5, 5450 / 6300);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
  const switcher = page.getByTestId("build-room-switcher");
  await expect(switcher.getByRole("tab")).toHaveCount(2);

  // 3. Rename + place a door.
  await switcher.getByRole("tab").nth(1).click();
  await page.getByTestId("build-room-name").fill("Studio");
  await page.getByTestId("build-room-name").blur();
  await expect(switcher.getByRole("tab", { name: "Studio" })).toBeVisible();
  await page.locator('[data-build-tool="place-door"]').click();
  await placeNewSingleDoor(page);

  // Freeform face: draw a closed polygon room, then snap a cabinet run to one of its walls.
  await page.locator('[data-build-tool="draw-room"]').click();
  for (const [x, y] of [[0.12, 0.18], [0.88, 0.18], [0.88, 0.58], [0.12, 0.58]] as const) {
    const point = await pointOnPaper(paper, x, y);
    await page.mouse.click(point.x, point.y);
  }
  await page.getByRole("button", { name: /Close polygon/ }).click();
  await expect(switcher.getByRole("tab")).toHaveCount(3);
  await switcher.getByRole("tab").last().click();
  const freeformRoomId = await page.locator("[data-room-floor]").getAttribute("data-room-floor");
  expect(freeformRoomId).toBeTruthy();
  const hostWallId = await longestRoomWallId(page, freeformRoomId!);
  expect(hostWallId).toBeTruthy();
  await clickWallMidpoint(page, hostWallId!);

  await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
  await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
  await expect(page.locator("[data-object-id]")).toHaveCount(1);
  await expect(page.locator("[data-object-id]").first()).toHaveAttribute("data-wall-id", hostWallId!);
  await expect(page.locator("[data-wall-snapped]")).toHaveAttribute("data-wall-snapped", "true");
  const xPosition = page.locator(".lr-inspector-scroll").getByRole("spinbutton", { name: "X mm", exact: true });
  await xPosition.fill("-1200");
  await xPosition.blur();
  await expect(page.locator("[data-object-id]").first()).toHaveAttribute("transform", /translate\(-1200 /);
  const wallRotation = await page.locator("[data-object-id]").first().getAttribute("data-rotation-y");
  await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
  await expect(page.locator("[data-object-id]")).toHaveCount(2);
  await expect(page.locator(`[data-object-id][data-wall-id="${hostWallId}"]`)).toHaveCount(2);
  await expect(page.locator(`[data-object-id][data-rotation-y="${wallRotation}"]`)).toHaveCount(2);
  await expect(page.locator("[data-wall-snapped]")).toHaveAttribute("data-wall-snapped", "true");
  const objects = page.locator("[data-object-id]");
  await objects.nth(0).click({ modifiers: ["Shift"] });
  await expect(page.locator("[data-object-id].is-selected")).toHaveCount(2);
  await page.getByRole("button", { name: "Create cabinet run", exact: true }).click();
  await expect(page.locator(".lr-cabinet-run-inspector")).toBeVisible();
  await expect(page.locator("[data-run-wall-id]")).toHaveAttribute("data-run-wall-id", hostWallId!);

  // 5. Review in dollhouse.
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await expect(page.getByRole("button", { name: "Dollhouse", exact: true })).toHaveClass(/is-active/);
  await expect(page.locator(".lr-model-viewport canvas")).toBeVisible();

  // 6. Export millwork schedule + client package. Accepted-still trust is covered by K1.
  await page.getByRole("button", { name: "2D", exact: true }).click();
  const scheduleCsv = page.getByRole("button", { name: "Schedule CSV", exact: true });
  await expect(scheduleCsv).toBeEnabled();
  const scheduleDownload = page.waitForEvent("download");
  await scheduleCsv.click();
  expect((await scheduleDownload).suggestedFilename()).toMatch(/schedule.*\.csv$/i);

  await page.getByRole("button", { name: "4 · Review + export", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Render studio");

  const captured: string[] = [];
  page.on("download", (download) => {
    captured.push(download.suggestedFilename());
  });
  await page.locator(".lr-render-actions").getByRole("button", { name: "Client Package", exact: true }).click();
  await expect.poll(() => captured.some((name) => name.endsWith("-client-preview.pdf")), { timeout: 30_000 }).toBe(true);
  await expect.poll(() => captured.some((name) => name.endsWith("-millwork-schedule.pdf")), { timeout: 30_000 }).toBe(true);
  await expect(
    page.getByTestId("lr-plan-canvas").getByText(/Client package exported \(PDF, JSON, millwork schedule/i),
  ).toBeVisible();
});
