import { expect, test, type Locator, type Page } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

async function clickWall(page: Page, wall: Locator) {
  const box = await wall.boundingBox();
  if (!box) throw new Error("Wall is not rendered");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test("Phase C plan readability shows measured dims, units, wall labels, and style toggles", async ({ page }) => {
  await createShellPlan(page);
  await expect(page.getByTestId("lr-plan-canvas")).toBeVisible();

  const readability = page.locator(".lr-plan-titlebar .lr-readability-toolbar");
  await expect(readability).toBeVisible();

  const dimensionPairs = page.locator(".lr-plan-dimension-pairs");
  await expect(dimensionPairs).toBeVisible();
  await expect(dimensionPairs.getByText(/^Clear /)).toHaveCount(2);
  await expect(dimensionPairs.getByText(/^Overall /)).toHaveCount(2);
  await expect(dimensionPairs.getByText("Clear 6080 mm")).toBeVisible();
  await expect(dimensionPairs.getByText("Overall 6320 mm")).toBeVisible();

  const backWall = page.locator('[data-wall-id="lr-wall-back"]');
  await expect(backWall).toHaveCount(1);
  // The new selection-first chrome keeps wall dimensions quiet until selected.
  await expect(page.locator("[data-wall-length-id]")).toHaveCount(0);

  const frontWall = page.locator('[data-wall-id="lr-wall-front"]');
  await clickWall(page, frontWall);
  await expect(page.locator('[data-wall-length-id="lr-wall-front"]')).toHaveText("6200 mm");
  await expect(page.locator('[data-wall-length-id="lr-wall-back"]')).toHaveCount(0);

  await readability.getByLabel("Display units").selectOption("cm");
  await expect(page.getByText("Scale: Fit · Units: cm")).toBeVisible();
  await expect(dimensionPairs.getByText("Clear 608 cm")).toBeVisible();
  await expect(page.locator('[data-wall-length-id="lr-wall-front"]')).toHaveText("620 cm");

  await readability.getByLabel("Show all wall lengths").check();
  await expect(page.locator("[data-wall-length-id]")).toHaveCount(4);

  await readability.getByRole("button", { name: "Line", exact: true }).click();
  await expect(page.locator(".lr-plan-svg")).toHaveClass(/is-line-style/);
  await readability.getByRole("button", { name: "Fill", exact: true }).click();
  await expect(page.locator(".lr-plan-svg")).toHaveClass(/is-fill-style/);

  await page.getByTestId("interiors-tool-import").click();
  await expect(page.getByRole("slider", { name: "Underlay opacity", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Choose plan image", exact: true })).toBeVisible();
});
