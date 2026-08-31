import { expect, test, type Page } from "@playwright/test";

async function openPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
}

test("H5 exposes active room and wall construction in the inspector", async ({ page }) => {
  await openPlan(page);
  await page.locator('[data-build-tool="select"]').click();
  const inspector = page.locator(".lr-inspector");
  await expect(inspector.getByText("Room", { exact: true })).toBeVisible();
  await inspector.locator(".lr-wall-inspector").evaluate((element) => element.scrollIntoView({ block: "center" }));
  await expect(inspector.getByLabel("Thickness")).toBeVisible();
  await expect(inspector.getByLabel("Height")).toHaveCount(2);

  const wallSection = inspector.locator(".lr-wall-inspector");
  const swatches = wallSection.locator('[aria-label="Material browser"] [data-material-id]');
  await expect(swatches.first()).toBeVisible();
  const active = wallSection.locator('[aria-label="Material browser"] [data-material-id].is-active');
  const originalId = await active.getAttribute("data-material-id");
  expect(originalId).toBeTruthy();

  await wallSection.getByRole("button", { name: "Clear wall material", exact: true }).click();
  await expect(wallSection.locator('[aria-label="Material browser"] [data-material-id].is-active')).toHaveCount(0);

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(wallSection.locator(`[data-material-id="${originalId}"].is-active`)).toBeVisible();

  const oak = wallSection.locator('[data-material-id="lr-material-natural-oak"]');
  await oak.click();
  await expect(oak).toHaveClass(/is-active/);
});
