import { expect, test, type Page } from "@playwright/test";
import { waitForRecoveryAutosave } from "./phase-7-hardening.helpers";
import { clickInteriorsTool, createBlankPlanForReopen, drawRectangleRoom } from "./plannerStart";

/** Plan mm → screen px through the plan SVG's current transform. */
async function planPoint(page: Page, x: number, z: number) {
  return page.locator('svg[aria-label="Living room plan editor"]').evaluate((svg, point) => {
    const matrix = (svg as SVGSVGElement).getScreenCTM();
    if (!matrix) throw new Error("Plan SVG has no screen matrix");
    const screen = new DOMPoint(point.x, point.z).matrixTransform(matrix);
    return { x: screen.x, y: screen.y };
  }, { x, z });
}

/** World-mm envelope of the drawn walls; the view re-fits after a room is drawn, so paper fractions drift. */
async function roomBoundsMm(page: Page) {
  return page.locator("[data-wall-id]").evaluateAll((lines) => {
    const xs = lines.flatMap((line) => [Number(line.getAttribute("x1")), Number(line.getAttribute("x2"))]);
    const zs = lines.flatMap((line) => [Number(line.getAttribute("y1")), Number(line.getAttribute("y2"))]);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
  });
}

async function dragWorld(page: Page, x0: number, z0: number, x1: number, z1: number) {
  const start = await planPoint(page, x0, z0);
  const end = await planPoint(page, x1, z1);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
}

async function enterModel(page: Page) {
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  const guide = page.getByRole("button", { name: "Close 3D guide" });
  if (await guide.isVisible().catch(() => false)) await guide.click();
}

/**
 * Ceiling roadmap Phase 1 exit gate: two rectangular cutouts drawn on the plan
 * become holes in the 3D slab, the inspector lists and deletes them, and they
 * survive save → reopen.
 */
test("Phase 1: ceiling cutouts draw on the plan, reach 3D, and survive a reopen", async ({ page }) => {
  test.setTimeout(120_000);
  await createBlankPlanForReopen(page);
  await drawRectangleRoom(page);
  await expect(page.locator("[data-wall-id]")).toHaveCount(4);
  const room = await roomBoundsMm(page);
  const w = room.maxX - room.minX;
  const d = room.maxZ - room.minZ;
  const at = (fx: number, fz: number) => [room.minX + w * fx, room.minZ + d * fz] as const;

  // The cutout tool lives with the other architecture tools; arming it shows the ceiling layer.
  await clickInteriorsTool(page, "wall");
  await page.locator('[data-build-tool="draw-ceiling-cutout"]').click();
  await expect(page.getByTestId("lr-plan-ceiling")).toHaveCount(1);
  await dragWorld(page, ...at(0.15, 0.15), ...at(0.35, 0.35));
  await dragWorld(page, ...at(0.55, 0.55), ...at(0.75, 0.75));
  await expect(page.locator("[data-ceiling-cutout-id]")).toHaveCount(2);

  // One dragged out through the wall is refused and says why.
  await dragWorld(page, ...at(0.6, 0.2), ...at(1.3, 0.4));
  await expect(page.locator("[data-ceiling-cutout-id]")).toHaveCount(2);
  await expect(page.getByTestId("interiors-activity-status")).toContainText("inside the room");

  // Keep the layer on so the cutouts stay visible once the tool is put down.
  await page.getByTestId("lr-plan-layers-panel").locator("summary").click();
  await page.getByTestId("lr-ceiling-layer-toggle").check();
  await clickInteriorsTool(page, "select");
  await expect(page.locator("[data-ceiling-cutout-id]")).toHaveCount(2);

  // 3D: the slab carries two holes whether or not the toggle shows it.
  await enterModel(page);
  const model = page.getByTestId("lr-model-viewport");
  await expect(model).toHaveAttribute("data-ceiling-holes", "2");
  await page.getByTestId("model-show-ceiling").click();
  await expect(model).toHaveAttribute("data-ceiling-hidden", "0");
  await page.getByRole("button", { name: "2D", exact: true }).click();

  // The inspector lists both and deletes one.
  await expect(page.locator("[data-ceiling-cutout-row]")).toHaveCount(2);
  await page.getByRole("button", { name: "Delete cutout cutout-2" }).click();
  await expect(page.locator("[data-ceiling-cutout-id]")).toHaveCount(1);

  // Reopen keeps the remaining cutout.
  await waitForRecoveryAutosave(page);
  await page.reload();
  await expect(page.getByTestId("interiors-projects-home")).toHaveCount(0);
  await expect(page.locator("[data-wall-id]")).toHaveCount(4);
  await expect(page.locator("[data-ceiling-cutout-id]")).toHaveCount(1);
  await enterModel(page);
  await expect(page.getByTestId("lr-model-viewport")).toHaveAttribute("data-ceiling-holes", "1");
});
