import { expect, test } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("import plan places a tracing underlay and never calls extract", async ({ page }) => {
  let extractHits = 0;
  await page.route("**/extract*", async (route) => {
    extractHits += 1;
    await route.abort("failed");
  });
  await createShellPlan(page);
  await page.getByRole("button", { name: "Import plan", exact: true }).click();
  await page.getByTestId("lr-plan-underlay-input").setInputFiles({
    name: "plan.png",
    mimeType: "image/png",
    buffer: TINY_PNG,
  });
  await expect(page.getByTestId("lr-underlay-controls")).toBeVisible();
  await expect(page.getByTestId("lr-plan-underlay-image")).toBeVisible();
  await expect(page.getByTestId("lr-floorplan-extract-review")).toHaveCount(0);
  await expect(page.getByTestId("lr-floorplan-extract-status")).toHaveCount(0);
  await expect(page.getByTestId("lr-underlay-dwg-dialog")).toHaveCount(0);
  expect(extractHits).toBe(0);
});
