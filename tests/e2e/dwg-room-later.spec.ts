import { expect, test } from "@playwright/test";
import { clickInteriorsTool } from "./plannerStart";
import { confirmCalibrateSouthWall, importRoomDxf, planWalls } from "./dwg-room-design.helpers";

test("suggest walls from layers and place recognized cabinet blocks", async ({ page }) => {
  test.setTimeout(90_000);
  await importRoomDxf(page);
  await confirmCalibrateSouthWall(page);
  await clickInteriorsTool(page, "import");
  await expect(page.getByTestId("lr-dwg-suggest-highlight").locator("polyline")).toHaveCount(6);
  await expect(page.getByTestId("lr-dwg-suggest-layer-Walls")).toBeChecked();
  await page.getByTestId("lr-underlay-suggest-walls").click();
  await expect(planWalls(page)).toHaveCount(6);
  await page.getByTestId("lr-underlay-place-cabinets").click();
  await expect(page.locator('[data-catalog-item-id="living:base-cabinet-900"]')).toHaveCount(1);
});
