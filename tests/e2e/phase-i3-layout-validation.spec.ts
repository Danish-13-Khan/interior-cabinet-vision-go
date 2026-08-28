import { expect, test, type Page } from "@playwright/test";

async function openDesignPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: "Create a room", exact: true }).click();
  await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
  await expect(page.getByText("Millwork Design", { exact: true })).toBeVisible();
}

test("I3 flags overlapping cabinets and lets the designer select the conflict", async ({ page }) => {
  await openDesignPlan(page);
  const cabinet = page.locator(".lr-asset-grid").getByRole("button", { name: /Wardrobe Wall.*Place/ });
  await cabinet.click();
  await cabinet.click();

  const titlebarExports = page.locator(".lr-plan-titlebar .lr-millwork-export button");
  await expect(titlebarExports).toHaveCount(3);
  await expect(titlebarExports.nth(0)).toBeDisabled();
  await expect(titlebarExports.nth(1)).toBeDisabled();
  await expect(titlebarExports.nth(2)).toBeDisabled();

  const initiallySelectedId = await page.locator(".lr-plan-object.is-selected").getAttribute("data-object-id");
  await page.getByRole("button", { name: "4 · Review + export", exact: true }).click();
  const reviewOverlap = page.locator('.planner-v2-review [data-layout-issue="overlap"]').first();
  await expect(reviewOverlap).toBeVisible();
  await expect(reviewOverlap).toHaveAttribute("aria-label", /error: .*overlaps/);
  await expect(page.getByRole("button", { name: "Export CSV", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Export PDF", exact: true })).toBeDisabled();
  await reviewOverlap.click();
  await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
  await expect(page.locator(".lr-plan-object.is-selected")).not.toHaveAttribute("data-object-id", initiallySelectedId ?? "");

  const overlap = page.locator('[data-layout-issue="overlap"]').first();
  await expect(overlap).toBeVisible();
  await expect(overlap).toHaveAttribute("aria-label", /error: .*overlaps/);
  await overlap.click();
  await expect(page.locator(".lr-plan-object.is-selected")).toHaveCount(1);
  await expect(page.locator(".lr-plan-object.is-selected")).not.toHaveAttribute("data-object-id", initiallySelectedId ?? "");
});
