import { expect, test, type Page } from "@playwright/test";
import { waitForRecoveryAutosave } from "./phase-7-hardening.helpers";
import { clickInteriorsTool, createBlankPlanForReopen, drawRectangleRoom, pointOnPaper } from "./plannerStart";

async function dragOnPaper(page: Page, x0: number, y0: number, x1: number, y1: number) {
  const paper = page.getByRole("application", { name: "Living room plan editor" });
  const start = await pointOnPaper(paper, x0, y0);
  const end = await pointOnPaper(paper, x1, y1);
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
 * survive save → reopen. The room spans 28–72 % of the paper (drawRectangleRoom).
 */
test("Phase 1: ceiling cutouts draw on the plan, reach 3D, and survive a reopen", async ({ page }) => {
  test.setTimeout(120_000);
  await createBlankPlanForReopen(page);
  await drawRectangleRoom(page);
  await expect(page.locator("[data-wall-id]")).toHaveCount(4);

  // The cutout tool lives with the other architecture tools; arming it shows the ceiling layer.
  await clickInteriorsTool(page, "wall");
  await page.locator('[data-build-tool="draw-ceiling-cutout"]').click();
  await expect(page.getByTestId("lr-plan-ceiling")).toHaveCount(1);
  await dragOnPaper(page, 0.34, 0.34, 0.44, 0.44);
  await dragOnPaper(page, 0.56, 0.56, 0.66, 0.66);
  await expect(page.locator("[data-ceiling-cutout-id]")).toHaveCount(2);

  // One dragged across the wall is refused.
  await dragOnPaper(page, 0.6, 0.3, 0.8, 0.4);
  await expect(page.locator("[data-ceiling-cutout-id]")).toHaveCount(2);

  // Keep the layer on so the cutouts stay visible once the tool is put down.
  await page.getByTestId("lr-plan-layers-panel").locator("summary").click();
  await page.getByTestId("lr-ceiling-layer-toggle").check();
  await clickInteriorsTool(page, "select");
  await expect(page.locator("[data-ceiling-cutout-id]")).toHaveCount(2);

  // 3D: the slab carries two holes whether or not the toggle shows it.
  await enterModel(page);
  const model = page.getByTestId("lr-model-viewport");
  await expect(model).toHaveAttribute("data-ceiling-cutouts", "2");
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
  await expect(page.getByTestId("lr-model-viewport")).toHaveAttribute("data-ceiling-cutouts", "1");
});
