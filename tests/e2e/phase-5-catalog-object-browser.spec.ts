import { expect, test } from "@playwright/test";
import { clickInteriorsTool, openInteriorsHome } from "./plannerStart";

test("Phase 5 Object Browser: categories → search → place → 3D", async ({ page }) => {
  test.setTimeout(process.env.CI ? 180_000 : 90_000);
  await openInteriorsHome(page);

  await expect(page.getByTestId("interiors-popular-templates")).toBeVisible();
  await page.getByTestId("catalog-template-template:core:empty-room:v1").click();
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeHidden();
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Empty Room");
  await expect(page.locator(".lr-plan-svg [data-catalog-item-id]")).toHaveCount(0);

  await clickInteriorsTool(page, "objects");
  await expect(page.getByTestId("catalog-object-browser")).toBeVisible();
  await expect(page.getByTestId("catalog-object-grid").locator("button")).toHaveCount(33);

  await page.getByTestId("catalog-object-category-bathroom").click();
  await expect(page.getByTestId("catalog-object-card-toilet-1")).toBeVisible();
  await expect(page.getByTestId("catalog-object-card-lounge-sofa-1")).toHaveCount(0);

  await page.getByTestId("catalog-object-category-all").click();
  await page.getByTestId("catalog-object-search").fill("lounge sofa");
  await expect(page.getByTestId("catalog-object-card-lounge-sofa-1")).toBeVisible();
  await expect(page.getByTestId("catalog-object-grid").locator("button")).toHaveCount(1);

  await page.getByTestId("catalog-object-card-lounge-sofa-1").click();
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="lounge-sofa-1"]')).toHaveCount(1);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
});
