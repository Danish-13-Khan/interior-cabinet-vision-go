import { expect, test } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

test("Phase M6.3 imports a curated manufacturer finish into project-owned bytes", async ({ page }) => {
  test.setTimeout(60_000);
  await createShellPlan(page);
  await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();
  await page.keyboard.press("b");
  await expect(page.getByText("Material Browser", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Floor", exact: true }).click();

  await expect(page.getByTestId("manufacturer-catalogue")).toBeVisible();
  await page.getByTestId("manufacturer-catalogue-select").selectOption("mfr:atelier-woods");
  await page.getByTestId("manufacturer-finish-select").selectOption("mfr:atelier-woods:smoked-walnut");
  await expect(page.getByTestId("manufacturer-finish-meta")).toContainText(/Atelier Woods|AW-SW-01/);
  await page.getByTestId("manufacturer-finish-stage").click();
  await expect(page.getByTestId("finish-import-preview")).toBeVisible();
  await page.getByTestId("finish-import-apply").click();
  await expect(page.getByTestId("finish-import-preview")).toHaveCount(0);

  const swatch = page.locator('[aria-label="Material browser"] [data-material-id="finish-import-1"]');
  await expect(swatch).toBeVisible();
  await expect(swatch.locator("i.has-map")).toBeVisible();
  await expect(page.locator("[data-room-floor]").first()).toHaveAttribute("fill", "#4b3328");
});
