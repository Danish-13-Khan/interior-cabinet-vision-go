import { expect, test, type Page } from "@playwright/test";
import { openInteriorsHome } from "./plannerStart";

async function openBuildPlan(page: Page) {
  await openInteriorsHome(page);
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
}

test("I4 offers curated opening families and SKU millwork", async ({ page }) => {
  await openBuildPlan(page);
  await page.locator('[data-build-tool="place-door"]').click();
  await expect(page.locator('[aria-label="door catalog"] [data-catalog-item]')).toHaveCount(4);
  await page.locator('[data-catalog-item="opening:door-sliding"]').click();
  await page.getByRole("button", { name: /Place door on selected wall/ }).click();
  await expect(page.locator('[data-opening-id][data-catalog-item="opening:door-sliding"]')).toHaveCount(1);

  await page.locator('[data-build-tool="place-window"]').click();
  await expect(page.locator('[aria-label="window catalog"] [data-catalog-item]')).toHaveCount(4);
  await page.locator('[data-catalog-item="opening:window-awning"]').click();
  await page.getByRole("button", { name: /Place window on selected wall/ }).click();
  await expect(page.locator('[data-opening-id][data-catalog-item="opening:window-awning"]')).toHaveCount(1);

  await page.getByTestId("interiors-tool-cabinet").click();
  await expect(page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*MW-BASE-900.*Place/ })).toBeVisible();
});
