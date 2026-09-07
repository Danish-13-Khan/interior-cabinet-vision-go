import { expect, test } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

test("Phase M6 imports texture from URL into project-owned bytes", async ({ page }) => {
  test.setTimeout(60_000);
  const imageUrl = "https://textures.example.test/sample-finish.png";
  await page.route(imageUrl, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(TINY_PNG_BASE64, "base64"),
    });
  });

  await createShellPlan(page);
  await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();
  await page.keyboard.press("b");
  await expect(page.getByText("Material Browser", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Floor", exact: true }).click();

  await page.getByTestId("finish-import-url-input").fill(imageUrl);
  await page.getByTestId("finish-import-url-submit").click();
  await expect(page.getByTestId("finish-import-preview")).toBeVisible();
  await page.getByTestId("finish-import-apply").click();
  await expect(page.getByTestId("finish-import-preview")).toHaveCount(0);
  const swatch = page.locator('[aria-label="Material browser"] [data-material-id="finish-import-1"]');
  await expect(swatch).toBeVisible();
  await expect(swatch.locator("i.has-map")).toBeVisible();

  await page.route(imageUrl, async (route) => route.abort());
  await page.getByTestId("finish-import-url-input").fill(imageUrl);
  await page.getByTestId("finish-import-url-submit").click();
  await expect(page.getByTestId("finish-import-error")).toContainText(/blocked by the site or network|Could not/);
});
