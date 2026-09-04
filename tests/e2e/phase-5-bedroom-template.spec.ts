import { expect, test, type Page } from "@playwright/test";
import { openInteriorsHome } from "./plannerStart";

async function selectCatalogObject(page: Page, catalogItemId: string) {
  const target = page.locator(`.lr-plan-svg [data-catalog-item-id="${catalogItemId}"]`).first();
  await expect(target).toBeVisible();
  await target.click({ force: true });
  await expect(page.locator(`.lr-plan-svg [data-catalog-item-id="${catalogItemId}"].is-selected`)).toBeVisible();
}

test("Phase 5 Bedroom: template → 2D → finish → 3D → save → reopen", async ({ page }) => {
  test.setTimeout(process.env.CI ? 180_000 : 90_000);
  await openInteriorsHome(page);

  await expect(page.getByTestId("interiors-popular-templates")).toBeVisible();
  await page.getByTestId("catalog-template-template:core:bedroom:v1").click();
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeHidden();
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Bedroom");
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Room plan");
  await expect(page.locator(".lr-plan-svg [data-catalog-item-id]")).toHaveCount(7);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="kenney:bed-double"]')).toHaveCount(1);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="kenney:cabinet-bed-drawer-table"]')).toHaveCount(2);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="kenney:lamp-round-table"]')).toHaveCount(1);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="kenney:bookcase-open"]')).toHaveCount(1);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="kenney:rug-rectangle"]')).toHaveCount(1);
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="kenney:pillow"]')).toHaveCount(1);

  await selectCatalogObject(page, "kenney:bed-double");
  await expect(page.getByTestId("interiors-inspector")).toContainText("Double Bed");
  const upholstery = page.locator('[data-material-slot="upholstery"]');
  await expect(upholstery).toBeVisible();
  await upholstery.getByTitle("Apply Olive Weave").click();
  await expect(upholstery.locator('[data-material-id="material:core:fabric-olive:v1"]')).toHaveClass(/is-active/);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("interiors-save-state").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename().toLowerCase()).toMatch(/bedroom|cabinet|project|\.json$/);

  await page.getByTestId("interiors-project-crumb").evaluate((button: HTMLButtonElement) => button.click());
  const recent = page.getByTestId("open-recent-project").filter({ hasText: "Bedroom" }).first();
  await expect(recent).toBeVisible();
  await recent.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeHidden();
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Bedroom");
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Room plan");
  await expect(page.locator('.lr-plan-svg [data-catalog-item-id="kenney:bed-double"]')).toHaveCount(1);

  await selectCatalogObject(page, "kenney:bed-double");
  await expect(
    page.locator('[data-material-slot="upholstery"] [data-material-id="material:core:fabric-olive:v1"]'),
  ).toHaveClass(/is-active/);
});
