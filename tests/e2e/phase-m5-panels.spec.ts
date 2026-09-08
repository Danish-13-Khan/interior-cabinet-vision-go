import { expect, test, type Locator, type Page } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

async function clickWallLine(page: Page, wall: Locator) {
  await wall.click({ force: true });
}

test("Phase M5 adds two panels, hides one, and keeps host wall structure", async ({ page }) => {
  test.setTimeout(60_000);
  await createShellPlan(page);
  await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();

  const wall = page.locator('line[data-wall-id="lr-wall-back"]');
  await expect(wall).toHaveCount(1);
  await clickWallLine(page, wall);

  await expect(page.getByTestId("add-wall-panel")).toBeVisible();
  await page.getByTestId("add-wall-panel").click();
  await expect(page.getByTestId("panel-attachment-inspector")).toBeVisible();

  // Add a second panel from the selected-panel inspector (wall line is under the panel).
  await expect(page.getByTestId("add-wall-panel")).toBeVisible();
  await page.getByTestId("add-wall-panel").click();

  const panels = page.locator('[data-catalog-item-id="living:decorative-panel"]');
  await expect(panels).toHaveCount(2);

  await panels.first().click({ force: true });
  await expect(page.getByTestId("panel-attachment-inspector")).toBeVisible();
  await page.getByTestId("panel-toggle-visible").click();
  await expect(panels).toHaveCount(1);

  await expect(page.locator('line[data-wall-id="lr-wall-back"]')).toHaveCount(1);
  await page.keyboard.press("Escape");
  await clickWallLine(page, wall);
  await expect(page.getByTestId("add-wall-panel")).toBeVisible();
});
