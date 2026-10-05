import { expect, openRenderStudio, test } from "./phase-k1-hybrid-stills.helpers";

// One fresh browser per K1 spec file; see the helpers for why.
test.use({ freshBrowserSlot: 3 });

test("K1 hybrid stills: reject leaves project editable", async ({ page }) => {
  test.setTimeout(240_000);
  await openRenderStudio(page);

  const generateStill = page.locator(".lr-render-actions").getByRole("button", { name: "Generate Still" });
  await expect(page.locator(".lr-plan-canvas canvas").first()).toBeVisible({ timeout: 30_000 });
  await generateStill.click();

  const review = page.getByTestId("still-review-panel");
  await expect(review).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId("still-review-status")).toHaveText("pending review", { timeout: 30_000 });
  await expect(page.getByTestId("still-trust-panel")).toContainText("TRUST OK", { timeout: 20_000 });

  const reject = review.getByRole("button", { name: "Reject" });
  await expect(reject).toBeEnabled();
  // Avoid actionability hangs when the review stage is still settling after generation.
  await reject.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByTestId("still-review-status")).toHaveText("rejected", { timeout: 15_000 });

  await page.getByRole("button", { name: "2D plan", exact: true }).click();
  await expect(page.getByRole("button", { name: "2D plan", exact: true })).toHaveClass(/is-active/);
  await expect(page.locator(".lr-plan-svg .lr-plan-object").first()).toBeVisible({ timeout: 15_000 });
});
