import { expect, test } from "@playwright/test";
import { clickInteriorsTool } from "./plannerStart";
import { confirmCalibrateSouthWall, importRoomDxf, openInteriorProjectJson, planWalls, saveInteriorProjectJson } from "./dwg-room-design.helpers";

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
  await expect(page.getByTestId("lr-dwg-suggest-apply")).toBeEnabled();
});

test("drop the draft when underlay pose changes", async ({ page }) => {
  test.setTimeout(90_000);
  await importRoomDxf(page);
  await confirmCalibrateSouthWall(page);
  await clickInteriorsTool(page, "import");
  await page.getByTestId("lr-underlay-suggest-walls").click();
  await expect(page.getByTestId("lr-dwg-suggest-draft")).toHaveCount(1);
  await page.getByLabel("Underlay rotation").fill("15");
  await expect(page.getByTestId("lr-dwg-suggest-draft")).toHaveCount(0);
  await expect(page.getByTestId("lr-dwg-suggest-candidate")).toHaveCount(0);
  await expect(planWalls(page)).toHaveCount(0);
});

test("apply suggested walls in one undo", async ({ page }) => {
  test.setTimeout(90_000);
  await importRoomDxf(page);
  await confirmCalibrateSouthWall(page);
  await clickInteriorsTool(page, "import");
  await page.getByTestId("lr-underlay-suggest-walls").click();
  await expect(page.getByTestId("lr-dwg-suggest-candidate")).toHaveCount(6);
  await page.getByTestId("lr-dwg-suggest-apply").click();
  await expect(planWalls(page)).toHaveCount(6);
  await expect(page.getByTestId("lr-dwg-suggest-draft")).toHaveCount(0);
  await expect(page.getByTestId("lr-dwg-suggest-candidate")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(planWalls(page)).toHaveCount(0);
});

test("save and reopen keeps walls and tracing, not the draft", async ({ page }) => {
  test.setTimeout(90_000);
  await importRoomDxf(page);
  await confirmCalibrateSouthWall(page);
  await clickInteriorsTool(page, "import");
  await page.getByTestId("lr-underlay-suggest-walls").click();
  await page.getByTestId("lr-dwg-suggest-apply").click();
  await expect(planWalls(page)).toHaveCount(6);
  const saved = await saveInteriorProjectJson(page);
  const text = JSON.stringify(saved);
  expect(text).toContain("hiddenLayers");
  expect(text).not.toContain("chain-1:seg");
  await openInteriorProjectJson(page, saved, "dwg-suggest.json");
  await expect(page.getByTestId("lr-plan-underlay-image")).toBeVisible();
  await expect(planWalls(page)).toHaveCount(6);
  await clickInteriorsTool(page, "import");
  await expect(page.getByTestId("lr-underlay-calibrated-chip")).toHaveText("Calibrated");
  await expect(page.getByTestId("lr-dwg-suggest-draft")).toHaveCount(0);
});
