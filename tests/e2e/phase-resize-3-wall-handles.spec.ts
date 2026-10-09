import { expect, test, type Page } from "@playwright/test";
import { createBlankPlan, drawRectangleRoom } from "./plannerStart";

type WallBox = { id: string; x1: number; x2: number; z1: number; z2: number };

async function wallBoxes(page: Page): Promise<WallBox[]> {
  return page.locator("[data-wall-id]").evaluateAll((lines) => lines.map((line) => ({
    id: line.getAttribute("data-wall-id")!,
    x1: Number(line.getAttribute("x1")), x2: Number(line.getAttribute("x2")),
    z1: Number(line.getAttribute("y1")), z2: Number(line.getAttribute("y2")),
  })));
}

/** The vertical wall with the largest x is the right face; the smallest is the left. */
function sideWalls(walls: WallBox[]) {
  const vertical = walls.filter((wall) => Math.abs(wall.x1 - wall.x2) < 1);
  const sorted = [...vertical].sort((a, b) => a.x1 - b.x1);
  return { left: sorted[0]!, right: sorted[sorted.length - 1]! };
}

async function enterModel(page: Page) {
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  const guide = page.getByRole("button", { name: "Close 3D guide" });
  if (await guide.isVisible().catch(() => false)) await guide.click();
}

/**
 * Resize roadmap Phase 3 exit gate: dragging the right face handle in 3D moves
 * the right wall, leaves the left wall where it was, and the 2D plan and the
 * Width field agree with the new geometry.
 */
test("Phase 3: the right face handle in 3D resizes the room one-sided", async ({ page }) => {
  test.setTimeout(120_000);
  await createBlankPlan(page);
  await drawRectangleRoom(page);
  await expect(page.locator("[data-wall-id]")).toHaveCount(4);
  const before = sideWalls(await wallBoxes(page));
  const widthField = page.getByLabel("Width · mm mm");
  const widthBefore = Number(await widthField.inputValue());

  await enterModel(page);
  await page.getByTestId("model-fit-room").click();
  const pickId = `wall-face:${before.right.id}`;
  const ready = () => page.evaluate((id) => Boolean(window.__lrModelPickApi?.raycastHitsPickId(id)), pickId);
  await expect.poll(ready, { timeout: 15_000 }).toBe(true);
  const point = await page.evaluate((id) => window.__lrModelPickApi!.screenPointForPickId(id), pickId);
  expect(point).toBeTruthy();

  // Drag the handle 120 px outward (to the right on screen for the right wall in Dollhouse).
  await page.mouse.move(point!.x, point!.y);
  await page.mouse.down();
  await page.mouse.move(point!.x + 60, point!.y, { steps: 4 });
  await expect(page.getByTestId("model-wall-resize-readout")).toBeVisible();
  await page.mouse.move(point!.x + 120, point!.y, { steps: 4 });
  await page.mouse.up();

  await page.getByRole("button", { name: "2D plan", exact: true }).click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(4);
  const after = sideWalls(await wallBoxes(page));
  expect(after.left.x1).toBeCloseTo(before.left.x1, 3);
  expect(after.right.x1).toBeGreaterThan(before.right.x1 + 100);
  const widthAfter = Number(await widthField.inputValue());
  expect(widthAfter - widthBefore).toBeCloseTo(after.right.x1 - before.right.x1, 0);
});
