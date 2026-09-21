import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { clickInteriorsTool } from "./plannerStart";
import { clickPlan, confirmCalibrateSouthWall, importRoomDxf, planWalls } from "./dwg-room-design.helpers";

const corners = [
  [-2000, 1500],
  [2000, 1500],
  [2000, -300],
  [200, -300],
  [200, -1500],
  [-2000, -1500],
] as const;

test("first release on the known-scale room drawing", async ({ page }) => {
  test.setTimeout(120_000);
  const dialog = await importRoomDxf(page);
  await expect(dialog.getByLabel("Millimeters per drawing unit")).toHaveValue("1");
  await expect(dialog.getByText("4000.0 × 3000.0 mm")).toBeVisible();
  await expect(dialog.getByText(/13 entities drawn/)).toBeVisible();
  await expect(dialog.getByText(/TEXT: 1/)).toBeVisible();
  await expect(dialog.getByRole("checkbox", { name: "Walls" })).toBeChecked();
  await confirmCalibrateSouthWall(page);
  await clickInteriorsTool(page, "room");
  for (const [x, z] of corners) await clickPlan(page, x, z);
  await page.getByRole("button", { name: "Close polygon (6)", exact: true }).click();
  await expect(planWalls(page)).toHaveCount(6);
  await clickInteriorsTool(page, "door");
  await clickPlan(page, 0, 1500);
  await expect(page.locator("[data-opening-id]")).toHaveCount(1);
  await clickInteriorsTool(page, "window");
  await clickPlan(page, -900, -1500);
  await expect(page.locator("[data-opening-id]")).toHaveCount(2);
  await clickInteriorsTool(page, "select");
  await clickPlan(page, -2000, 0);
  await clickInteriorsTool(page, "cabinet");
  await page.getByTestId("interiors-cabinet-run-catalog").locator("button").filter({ hasText: "Place" }).first().click();
  await expect(page.locator('[data-catalog-item-id="living:base-cabinet-900"]')).toHaveCount(1);
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  await page.getByRole("button", { name: "2D plan", exact: true }).click();
  await expect(planWalls(page)).toHaveCount(6);
  const download = page.waitForEvent("download");
  await page.getByTestId("interiors-save-state").click();
  const saved = JSON.parse(readFileSync((await (await download).path())!, "utf8"));
  await page.getByTestId("interiors-project-crumb").evaluate((button: HTMLButtonElement) => button.click());
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("dialog", { name: "Start a living room project" }).getByRole("button", { name: "Open project", exact: true }).click();
  await (await chooser).setFiles({ name: "dwg-first-release.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(saved)) });
  await expect(planWalls(page)).toHaveCount(6);
  await expect(page.locator("[data-opening-id]")).toHaveCount(2);
  await expect(page.locator('[data-catalog-item-id="living:base-cabinet-900"]')).toHaveCount(1);
  await page.getByTestId("lr-plan-export-panel").locator("summary").click();
  const sheet = page.waitForEvent("download");
  await page.getByTestId("lr-export-floor-plan").first().click();
  expect((await sheet).suggestedFilename()).toMatch(/\.pdf$/i);
});
