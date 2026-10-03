import { expect, openRenderStudio, test } from "./phase-k1-hybrid-stills.helpers";

// One fresh browser per K1 spec file; see the helpers for why.
test.use({ freshBrowserSlot: 1 });

test("K1 hybrid stills: generate, review, accept under trust contract", async ({ page }) => {
  test.setTimeout(180_000);
  await openRenderStudio(page);

  const generateStill = page.getByRole("button", { name: "Generate Still" });
  await expect(generateStill).toBeEnabled({ timeout: 60_000 });
  await expect(page.locator(".lr-plan-canvas canvas").first()).toBeVisible({ timeout: 30_000 });
  await generateStill.click();
  await expect(page.getByTestId("still-review-panel")).toBeVisible({ timeout: 90_000 });

  const review = page.getByTestId("still-review-panel");
  await expect(review).toContainText("Still review");
  await expect(review).toContainText("Hybrid Still");
  await expect(review).toContainText("faithful enhance", { ignoreCase: true });

  const trust = page.getByTestId("still-trust-panel");
  await expect(trust).toContainText("TRUST OK", { timeout: 20_000 });
  await expect(trust).toContainText("stilljob-hero");

  await expect(review.locator("img[alt='WebGL plate']")).toBeVisible();
  await expect(review.locator("img[alt='Hero still']")).toBeVisible();
  await expect(review.locator("img[alt='Diff']")).toBeVisible();

  const accept = review.getByRole("button", { name: "Accept" });
  await expect(accept).toBeEnabled();
  await accept.click();

  await expect(page.getByText(/Still accepted · will record provenance/i)).toBeVisible();
  await expect(review).toContainText("accepted");
  await expect(review).toContainText("1 accepted for package");
});
