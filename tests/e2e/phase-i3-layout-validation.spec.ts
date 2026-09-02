import { expect, test, type Page } from "@playwright/test";

async function openExportReadyDesignPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeVisible();
  await page.getByRole("button", { name: /Wardrobe wall/i }).click();
  await page.getByTestId("interiors-tool-cabinet").click();
  await expect(page.getByText("Millwork Design", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Schedule CSV", exact: true })).toBeEnabled();
}

async function openDesignPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
  await page.getByTestId("interiors-tool-cabinet").click();
  await expect(page.getByText("Millwork Design", { exact: true })).toBeVisible();
}

test("I3 flags overlapping cabinets and lets the designer select the conflict", async ({ page }) => {
  await openDesignPlan(page);
  const cabinet = page.locator(".lr-asset-grid").getByRole("button", { name: /Wardrobe Wall.*Place/ });
  await cabinet.click();
  await cabinet.click();

  const titlebarExports = page.locator(".lr-plan-titlebar .lr-millwork-export > button");
  await expect(titlebarExports).toHaveCount(3);
  await expect(titlebarExports.nth(0)).toBeDisabled();
  await expect(titlebarExports.nth(1)).toBeDisabled();
  await expect(titlebarExports.nth(2)).toBeDisabled();

  const initiallySelectedId = await page.locator(".lr-plan-object.is-selected").getAttribute("data-object-id");
  await page.getByTestId("interiors-present").click();
  const checklist = page.getByTestId("pre-export-checklist");
  await expect(checklist).toBeVisible();
  await expect(checklist).toContainText("Pre-export checklist");
  await expect(checklist.locator('[data-check-id="layout-clear"]')).toHaveAttribute("data-check-status", "fail");
  await expect(checklist.locator('[data-check-id="millwork-placed"]')).toHaveAttribute("data-check-status", "pass");
  const reviewOverlap = page.locator('.planner-v2-review [data-layout-issue="overlap"]').first();
  await expect(reviewOverlap).toBeVisible();
  await expect(reviewOverlap).toHaveAttribute("aria-label", /error: .*overlaps/);
  await expect(page.getByRole("button", { name: "Schedule CSV", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Schedule PDF", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Export client package", exact: true })).toBeDisabled();
  await expect(page.locator(".lr-render-actions").getByRole("button", { name: "Client Package", exact: true })).toBeDisabled();
  await reviewOverlap.click();
  await page.getByTestId("interiors-tool-cabinet").click();
  await expect(page.locator(".lr-plan-object.is-selected")).not.toHaveAttribute("data-object-id", initiallySelectedId ?? "");

  const overlap = page.locator('[data-layout-issue="overlap"]').first();
  await expect(overlap).toBeVisible();
  await expect(overlap).toHaveAttribute("aria-label", /error: .*overlaps/);
  await overlap.click();
  await expect(page.locator(".lr-plan-object.is-selected")).toHaveCount(1);
  await expect(page.locator(".lr-plan-object.is-selected")).not.toHaveAttribute("data-object-id", initiallySelectedId ?? "");
});

test("L1 production menu renders outside the clipped titlebar", async ({ page }) => {
  await openExportReadyDesignPlan(page);
  const production = page.getByRole("button", { name: "Production", exact: true });
  await expect(production).toBeEnabled();
  await production.click();
  const menu = page.locator("body > .lr-millwork-advanced-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Cutlist CSV", exact: true })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Production PDF", exact: true })).toBeVisible();
  await expect(page.locator(".lr-plan-titlebar .lr-millwork-advanced-menu")).toHaveCount(0);
});
