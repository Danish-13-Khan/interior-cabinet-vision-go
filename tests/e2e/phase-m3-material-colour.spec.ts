import { expect, test } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

const OAK_ID = "lr-material-natural-oak";
const SLATE_SHADE = "material-shade-paint-slate";

test("Phase M3 applies shade and custom HEX colour with recent chips", async ({ page }) => {
  test.setTimeout(60_000);
  await createShellPlan(page);
  await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();

  await page.keyboard.press("b");
  await expect(page.getByText("Material Browser", { exact: true })).toBeVisible();
  await expect(page.getByTestId("model-material-colour")).toBeVisible();

  await page.getByRole("tab", { name: "Floor", exact: true }).click();
  const oak = page.locator(`[aria-label="Material browser"] [data-material-id="${OAK_ID}"]`).first();
  await oak.click();
  await expect(oak).toHaveClass(/is-active/);

  await page.getByTestId("material-shade-wood-walnut").click();
  await expect(page.getByTestId("material-recent-4b3328")).toBeVisible();

  await page.getByTestId("material-colour-hex").fill("#112233");
  await page.getByTestId("material-colour-hex").press("Enter");
  await expect(page.getByTestId("material-recent-112233")).toBeVisible();

  // Paint family shades still available after switching to wall paint.
  await page.locator('[aria-label="Material browser"] [data-material-id="lr-material-wall-warm-white"]').first().click();
  await expect(page.getByTestId(SLATE_SHADE)).toBeVisible();
});
