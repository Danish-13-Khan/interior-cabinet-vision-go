import { expect, test, type Page } from "@playwright/test";
import { openInteriorsHome } from "./plannerStart";

async function selectCatalogObject(page: Page, catalogItemId: string) {
  const target = page.locator(`.lr-plan-svg [data-catalog-item-id="${catalogItemId}"]`).first();
  await expect(target).toBeVisible();
  await target.click({ force: true });
  await expect(page.locator(`.lr-plan-svg [data-catalog-item-id="${catalogItemId}"].is-selected`)).toBeVisible();
}

test("Phase 4 Living Room: template → 2D → 3D → finish → save → reopen", async ({ page }) => {
  test.setTimeout(process.env.CI ? 180_000 : 90_000);
  await openInteriorsHome(page);

  await expect(page.getByTestId("interiors-popular-templates")).toBeVisible();
  await page.getByTestId("catalog-template-template:core:living-room:v1").click();
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeHidden();
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Living Room");
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Room plan");
  await expect(page.locator(".lr-plan-svg [data-catalog-item-id]")).toHaveCount(8);

  await selectCatalogObject(page, "kenney:lounge-sofa");
  await expect(page.getByTestId("interiors-inspector")).toContainText("Lounge Sofa");
  const upholstery = page.locator('[data-material-slot="upholstery"]');
  await expect(upholstery).toBeVisible();
  await upholstery.getByTitle("Apply Olive Weave").click();
  await expect(upholstery.locator('[data-material-id="material:core:fabric-olive:v1"]')).toHaveClass(/is-active/);

  await selectCatalogObject(page, "kenney:television-modern");
  await expect(page.locator('[data-material-slot="screen"][data-slot-locked="true"]')).toBeVisible();
  await expect(page.locator('[data-material-slot="screen"] .lr-paint-swatches')).toHaveCount(0);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("interiors-save-state").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename().toLowerCase()).toMatch(/living|cabinet|project|\.json$/);

  await page.getByTestId("interiors-project-crumb").evaluate((button: HTMLButtonElement) => button.click());
  const recent = page.getByTestId("open-recent-project").filter({ hasText: "Living Room" }).first();
  await expect(recent).toBeVisible();
  await recent.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeHidden();
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Living Room");
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Room plan");

  await selectCatalogObject(page, "kenney:lounge-sofa");
  await expect(
    page.locator('[data-material-slot="upholstery"] [data-material-id="material:core:fabric-olive:v1"]'),
  ).toHaveClass(/is-active/);
});
