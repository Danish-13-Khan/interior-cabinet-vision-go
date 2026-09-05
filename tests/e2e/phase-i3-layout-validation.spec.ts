import { expect, test, type Page } from "@playwright/test";
import { openInteriorsHome } from "./plannerStart";

async function openDesignPlan(page: Page) {
  await openInteriorsHome(page);
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
  await page.getByTestId("interiors-cabinet-run-issues-toggle").click();
  const overlap = page.getByTestId("interiors-cabinet-run-issues").locator('[data-layout-issue="overlap"]').first();
  await expect(overlap).toBeVisible();
  await expect(overlap).toHaveAttribute("aria-label", /error: .*overlaps/);
  // Status popover sits above the canvas; DOM click avoids the paper intercepting the hit-test.
  await overlap.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator(".lr-plan-object.is-selected")).toHaveCount(1);
  await expect(page.locator(".lr-plan-object.is-selected")).not.toHaveAttribute("data-object-id", initiallySelectedId ?? "");
});
