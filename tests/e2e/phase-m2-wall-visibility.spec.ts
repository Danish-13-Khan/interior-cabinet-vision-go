import { expect, test, type Locator, type Page } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";

async function clickWall(page: Page, wall: Locator) {
  const box = await wall.boundingBox();
  if (!box) throw new Error("Wall is not rendered");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test("Phase M2 hides a wall, lists it, and restores with Show All Walls", async ({ page }) => {
  test.setTimeout(60_000);
  await createShellPlan(page, { localStorage: { [GUIDE_KEY]: "dismissed" } });

  const wall = page.locator('[data-wall-id="lr-wall-back"]');
  await expect(wall).toHaveCount(1);
  await clickWall(page, wall);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();

  await expect(page.getByTestId("model-hide-wall")).toBeVisible();
  await page.getByTestId("model-hide-wall").click();

  await expect(page.getByTestId("model-wall-visibility")).toBeVisible();
  await expect(page.getByTestId("model-show-all-walls")).toBeVisible();
  await expect(page.getByTestId("model-hide-wall")).toHaveCount(0);

  await page.getByTestId("model-show-all-walls").click();
  await expect(page.getByTestId("model-wall-visibility")).toHaveCount(0);

  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.getByRole("button", { name: "2D", exact: true })).toHaveClass(/is-active/);
  // SVG <line> walls are often "hidden" to Playwright; assert presence like other plan specs.
  await expect(page.locator('[data-wall-id="lr-wall-back"]')).toHaveCount(1);
});
