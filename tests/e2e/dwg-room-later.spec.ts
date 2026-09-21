import { expect, test } from "@playwright/test";
import { clickInteriorsTool } from "./plannerStart";
import { confirmCalibrateSouthWall, importRoomDxf, planWalls } from "./dwg-room-design.helpers";

test("preview wall candidates without creating project walls", async ({ page }) => {
  test.setTimeout(90_000);
  await importRoomDxf(page);
  await confirmCalibrateSouthWall(page);
  await clickInteriorsTool(page, "import");
  await expect(page.getByTestId("lr-dwg-suggest-highlight").locator("polyline")).toHaveCount(6);
  await expect(page.getByTestId("lr-dwg-suggest-layer-Walls")).toBeChecked();
  await page.getByTestId("lr-underlay-suggest-walls").click();
  await expect(page.getByTestId("lr-dwg-suggest-candidate")).toHaveCount(6);
  await expect(page.locator('[data-testid="lr-dwg-suggest-candidate"][data-overlap="none"]')).toHaveCount(6);
  await expect(planWalls(page)).toHaveCount(0);
  await expect(page.getByTestId("lr-dwg-suggest-apply")).toBeDisabled();
});
