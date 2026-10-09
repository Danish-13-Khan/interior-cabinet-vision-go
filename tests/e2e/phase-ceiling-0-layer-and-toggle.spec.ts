import { expect, test, type Locator, type Page } from "@playwright/test";
import { waitForRecoveryAutosave } from "./phase-7-hardening.helpers";
import { clickInteriorsTool, createBlankPlanForReopen, drawRectangleRoom } from "./plannerStart";

async function clickWall(page: Page, wall: Locator) {
  const box = await wall.boundingBox();
  if (!box) throw new Error("Wall is not rendered");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function enterModel(page: Page) {
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  const guide = page.getByRole("button", { name: "Close 3D guide" });
  if (await guide.isVisible().catch(() => false)) await guide.click();
}

/**
 * Ceiling roadmap Phase 0 exit gate: the plan's Ceiling layer follows the
 * raised room, and the 3D Ceiling toggle keeps the slab in Dollhouse, never
 * changes Walkthrough, and does not survive a reopen (view state only).
 */
test("Phase 0: ceiling layer in plan and Ceiling toggle in 3D", async ({ page }) => {
  test.setTimeout(120_000);
  await createBlankPlanForReopen(page);
  await drawRectangleRoom(page);
  await expect(page.locator("[data-wall-id]")).toHaveCount(4);

  // Layer off by default; on, the raised room gets one ceiling path.
  const ceilingPath = page.getByTestId("lr-plan-ceiling");
  await expect(ceilingPath).toHaveCount(0);
  await page.getByTestId("lr-plan-layers-panel").locator("summary").click();
  await page.getByTestId("lr-ceiling-layer-toggle").check();
  await expect(ceilingPath).toHaveCount(1);

  // Lowering one wall to a plan trace removes the ceiling in 2D, as it does in 3D.
  await clickInteriorsTool(page, "select");
  await clickWall(page, page.locator("[data-wall-id]").first());
  await page.getByTestId("lower-walls").click();
  await expect(ceilingPath).toHaveCount(0);
  await page.getByTestId("raise-walls").click();
  await expect(ceilingPath).toHaveCount(1);

  // 3D: hidden in Dollhouse until the toggle; Walkthrough pins it on.
  await enterModel(page);
  const model = page.getByTestId("lr-model-viewport");
  const toggle = page.getByTestId("model-show-ceiling");
  await expect(model).toHaveAttribute("data-view-preset", "dollhouse");
  await expect(model).toHaveAttribute("data-ceiling-hidden", "1");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(model).toHaveAttribute("data-ceiling-hidden", "0");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await page.getByTestId("model-view-walkthrough").click();
  await expect(model).toHaveAttribute("data-view-preset", "walkthrough");
  await expect(model).toHaveAttribute("data-ceiling-hidden", "0");
  await expect(toggle).toBeDisabled();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await page.getByTestId("model-view-dollhouse").click();
  await expect(model).toHaveAttribute("data-view-preset", "dollhouse");
  await expect(model).toHaveAttribute("data-ceiling-hidden", "0");
  await toggle.click();
  await expect(model).toHaveAttribute("data-ceiling-hidden", "1");

  // Reopen: the plan layer is a remembered preference, the 3D toggle is not.
  await toggle.click();
  await expect(model).toHaveAttribute("data-ceiling-hidden", "0");
  await waitForRecoveryAutosave(page);
  await page.reload();
  await expect(page.getByTestId("interiors-projects-home")).toHaveCount(0);
  await expect(page.locator("[data-wall-id]")).toHaveCount(4);
  await expect(ceilingPath).toHaveCount(1);
  await enterModel(page);
  await expect(page.getByTestId("lr-model-viewport")).toHaveAttribute("data-ceiling-hidden", "1");
});
