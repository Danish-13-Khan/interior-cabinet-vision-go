import { expect, test } from "@playwright/test";
import {
  clickWallMidpoint,
  longestRoomWallId,
  placeNewSingleDoor,
  pointOnPaper,
} from "./roadmap-exit-journey.helpers";
import { createShellPlan } from "./plannerStart";

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";

/**
 * Roadmap §7 one-session exit journey:
 * footprint → Draw Wall split → openings/rename → freeform room + cabinet run → 3D → schedule + client package.
 */
test("Exit journey: footprint → split → run → 3D → schedule + client package", async ({ page }) => {
  test.setTimeout(240_000);
  await createShellPlan(page, { localStorage: { [GUIDE_KEY]: "dismissed" } });

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

  await page.getByTestId("interiors-tool-cabinet").click();
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
  const objectIds = await page.locator(".lr-plan-svg [data-object-id]").evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-object-id")).filter((id): id is string => Boolean(id)),
  );
  expect(objectIds).toHaveLength(2);
  await page.getByTestId(`inspector-object-${objectIds[0]}`).click();
  await page.getByTestId(`inspector-object-${objectIds[1]}`).click({ modifiers: ["Shift"] });
  await expect(page.locator(".lr-plan-svg [data-object-id].is-selected")).toHaveCount(2);
  await page.getByRole("button", { name: "Snap selection into run", exact: true }).click();
  await expect(page.locator(".lr-cabinet-run-inspector")).toBeVisible();
  await expect(page.locator("[data-run-wall-id]")).toHaveAttribute("data-run-wall-id", hostWallId!);

  // 5. Review in dollhouse.
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await expect(page.getByRole("button", { name: "Dollhouse", exact: true })).toHaveClass(/is-active/);
  await expect(page.locator(".lr-model-viewport canvas")).toBeVisible();

  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.getByRole("button", { name: "Schedule CSV", exact: true })).toHaveCount(0);

  await page.getByTestId("interiors-present").click();
  await expect(page.getByTestId("interiors-present-titlebar")).toContainText("Present and Send");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  await expect(page.getByTestId("proposal-live-total")).toBeVisible();
  await expect(page.getByRole("button", { name: "Freeze quote", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download client pack", exact: true })).toHaveCount(0);
});
