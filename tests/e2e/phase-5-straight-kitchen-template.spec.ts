import { expect, test } from "@playwright/test";
import { openInteriorsHome } from "./plannerStart";

test("Phase 5 Straight Kitchen: template → run + appliances → 3D → save → reopen", async ({ page }) => {
  test.setTimeout(process.env.CI ? 180_000 : 90_000);
  await openInteriorsHome(page);

  await expect(page.getByTestId("interiors-popular-templates")).toBeVisible();
  await page.getByTestId("catalog-template-template:core:straight-kitchen:v1").click();
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeHidden();
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Straight Kitchen");
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Room plan");

  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="kenney:kitchen-fridge"]')).toHaveCount(1);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="kenney:kitchen-stove-electric"]')).toHaveCount(1);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="kenney:kitchen-sink"]')).toHaveCount(1);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="kenney:hood-modern"]')).toHaveCount(1);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="living:base-cabinet-900"]')).toHaveCount(2);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="living:tall-pantry-600"]')).toHaveCount(1);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="living:drawer-cabinet-900"]')).toHaveCount(1);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("interiors-save-state").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename().toLowerCase()).toMatch(/straight|kitchen|cabinet|project|\.json$/);

  await page.getByTestId("interiors-project-crumb").evaluate((button: HTMLButtonElement) => button.click());
  const recent = page.getByTestId("open-recent-project").filter({ hasText: "Straight Kitchen" }).first();
  await expect(recent).toBeVisible();
  await recent.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeHidden();
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Straight Kitchen");
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Room plan");
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="kenney:kitchen-fridge"]')).toHaveCount(1);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="living:base-cabinet-900"]')).toHaveCount(2);
});
