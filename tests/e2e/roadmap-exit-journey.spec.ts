import { expect, test } from "@playwright/test";
import {
  clickWallMidpoint,
  dragWallBetween,
  longestRoomWallId,
  placeNewSingleDoor,
  pointOnPaper,
} from "./roadmap-exit-journey.helpers";
import { clickInteriorsTool, createShellPlan } from "./plannerStart";

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";

async function openRoomSettings(page: import("@playwright/test").Page) {
  const settings = page.locator("details.lr-plan-secondary-settings").first();
  if (!(await settings.evaluate((element) => (element as HTMLDetailsElement).open))) {
    await settings.locator("summary").click();
  }
}

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
  await dragWallBetween(page, "lr-wall-back", "lr-wall-front");
  const switcher = page.getByTestId("build-room-switcher");
  await openRoomSettings(page);
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
  // The room switcher only renders while "Room & plan settings" is expanded.
  await openRoomSettings(page);
  await expect(switcher.getByRole("tab")).toHaveCount(3);
  await switcher.getByRole("tab").last().click();
  const freeformRoomId = await page.locator("[data-room-floor]").getAttribute("data-room-floor");
  expect(freeformRoomId).toBeTruthy();
  const hostWallId = await longestRoomWallId(page, freeformRoomId!);
  expect(hostWallId).toBeTruthy();
  await clickWallMidpoint(page, hostWallId!);

  await clickInteriorsTool(page, "cabinet");
  await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
  await expect(page.locator(".lr-plan-svg [data-object-id]")).toHaveCount(1);
  await expect(page.locator(".lr-plan-svg [data-object-id]").first()).toHaveAttribute("data-wall-id", hostWallId!);
  await expect(page.locator("[data-wall-snapped]")).toHaveAttribute("data-wall-snapped", "true");
  // The Position fields sit in a collapsed inspector section.
  const position = page.locator("details.lr-transform-editor").first();
  if (!(await position.evaluate((element) => (element as HTMLDetailsElement).open))) {
    await position.locator("summary").click();
  }
  // A placed cabinet lands at the wall midpoint, which is not x=0 for a drawn room;
  // move it 1200 mm along from there so the next placement has the midpoint free.
  const placedTransform = await page.locator(".lr-plan-svg [data-object-id]").first().getAttribute("transform");
  const placedX = Number(/translate\((-?[\d.]+) /.exec(placedTransform ?? "")?.[1]);
  expect(Number.isFinite(placedX)).toBe(true);
  const movedX = placedX - 1200;
  const xPosition = page.locator(".lr-inspector-scroll").getByRole("spinbutton", { name: "X mm", exact: true });
  await xPosition.fill(String(movedX));
  await xPosition.blur();
  await expect(page.locator(".lr-plan-svg [data-object-id]").first()).toHaveAttribute("transform", new RegExp(`translate\\(${movedX} `));
  const wallRotation = await page.locator(".lr-plan-svg [data-object-id]").first().getAttribute("data-rotation-y");
  await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
  await expect(page.locator(".lr-plan-svg [data-object-id]")).toHaveCount(2);
  await expect(page.locator(`.lr-plan-svg [data-object-id][data-wall-id="${hostWallId}"]`)).toHaveCount(2);
  await expect(page.locator(`.lr-plan-svg [data-object-id][data-rotation-y="${wallRotation}"]`)).toHaveCount(2);
  await expect(page.locator("[data-wall-snapped]")).toHaveAttribute("data-wall-snapped", "true");
  const objectIds = await page.locator(".lr-plan-svg [data-object-id]").evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-object-id")).filter((id): id is string => Boolean(id)),
  );
  expect(objectIds).toHaveLength(2);
  // The Calm cabinets step has no inspector object list; multi-select on the plan.
  const planObjects = page.locator(".lr-plan-svg [data-object-id]");
  await planObjects.nth(0).click();
  await planObjects.nth(1).click({ modifiers: ["Shift"] });
  await expect(page.locator(".lr-plan-svg [data-object-id].is-selected")).toHaveCount(2);
  await page.getByRole("button", { name: "Snap selection into run", exact: true }).click();
  await expect(page.locator(".lr-cabinet-run-inspector")).toBeVisible();
  await expect(page.locator("[data-run-wall-id]")).toHaveAttribute("data-run-wall-id", hostWallId!);

  // 5. Review in dollhouse.
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await expect(page.getByRole("button", { name: "Dollhouse", exact: true })).toHaveClass(/is-active/);
  await expect(page.locator(".lr-model-viewport canvas")).toBeVisible();

  await page.getByRole("button", { name: "2D plan", exact: true }).click();
  await expect(page.getByRole("button", { name: "Schedule CSV", exact: true })).toHaveCount(0);

  await page.getByTestId("interiors-present").click();
  await expect(page.getByTestId("interiors-present-titlebar")).toContainText("Present and Send");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  await expect(page.getByTestId("proposal-live-total")).toBeVisible();
  await expect(page.getByRole("button", { name: "Freeze quote", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download client pack", exact: true })).toHaveCount(0);
});
