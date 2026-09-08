import { expect, test } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

test("Phase M contextual command rail adapts to wall and cabinet selection", async ({ page }) => {
  test.setTimeout(60_000);
  await createShellPlan(page);
  await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();

  const rail = page.getByTestId("contextual-command-rail");
  await expect(rail).toHaveAttribute("data-rail-kind", "none");
  await expect(page.getByTestId("rail-select")).toBeVisible();
  await expect(page.getByTestId("rail-measure")).toBeVisible();
  await expect(page.getByTestId("rail-camera")).toBeVisible();

  await page.getByTestId("interiors-tool-select").click();
  await page.locator('line[data-wall-id="lr-wall-back"]').click({ force: true });
  await expect(rail).toHaveAttribute("data-rail-kind", "wall");
  await expect(page.getByTestId("rail-add-panel")).toBeVisible();
  await page.getByTestId("rail-add-panel").click();
  await expect(page.locator('[data-catalog-item-id="living:decorative-panel"]')).toHaveCount(1);
  await expect(rail).toHaveAttribute("data-rail-kind", "panel");
  await expect(page.getByTestId("rail-flip-side")).toBeVisible();
  await expect(page.getByTestId("rail-rotate")).toHaveCount(0);

  await page.getByTestId("interiors-tool-cabinet").click();
  await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
  await expect(page.locator("[data-object-id].is-selected").first()).toBeVisible();
  await expect(rail).toHaveAttribute("data-rail-kind", "cabinet");
  await expect(page.getByTestId("rail-duplicate")).toBeVisible();
  await page.getByTestId("rail-material").click();
  await expect(page.getByText("Material Browser", { exact: true })).toBeVisible();
});

test("Phase M contextual command rail Measure is plan-only from Model view", async ({ page }) => {
  test.setTimeout(60_000);
  await createShellPlan(page);
  await expect(page.getByTestId("contextual-command-rail")).toBeVisible();

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  const rail = page.getByTestId("contextual-command-rail");
  await expect(rail).toHaveAttribute("data-rail-view", "model");
  await expect(page.getByTestId("rail-measure")).toHaveCount(0);
  await expect(page.getByTestId("rail-camera")).toBeVisible();
});
