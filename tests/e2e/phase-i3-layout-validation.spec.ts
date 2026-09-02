import { expect, test, type Page } from "@playwright/test";

async function openDesignPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
  await page.getByTestId("interiors-tool-cabinet").click();
  await expect(page.getByTestId("interiors-cabinet-run-catalog")).toBeVisible();
}

test("I3 flags overlapping cabinets and lets the designer select the conflict", async ({ page }) => {
  await openDesignPlan(page);
  const cabinet = page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ });
  await cabinet.click();
  await cabinet.click();

  await expect(page.getByRole("button", { name: "Schedule CSV", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Production", exact: true })).toHaveCount(0);

  const initiallySelectedId = await page.locator(".lr-plan-object.is-selected").getAttribute("data-object-id");
  const overlap = page.locator('[data-layout-issue="overlap"]').first();
  await expect(overlap).toBeVisible();
  await expect(overlap).toHaveAttribute("aria-label", /error: .*overlaps/);
  await overlap.click();
  await expect(page.locator(".lr-plan-object.is-selected")).toHaveCount(1);
  await expect(page.locator(".lr-plan-object.is-selected")).not.toHaveAttribute("data-object-id", initiallySelectedId ?? "");
});
