import { expect, test, type Page } from "@playwright/test";

async function openPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
}

async function pointOnPlan(page: Page, x: number, z: number) {
  const box = await page.locator(".lr-plan-svg").boundingBox();
  if (!box) throw new Error("Plan canvas is not rendered");
  return { x: box.x + box.width * x, y: box.y + box.height * z };
}

test("Phase E draws a surface zone, partition wall, and column", async ({ page }) => {
  await openPlan(page);
  const initialWalls = await page.locator("[data-wall-id]").count();

  await page.locator('[data-build-tool="draw-partition"]').click();
  const start = await pointOnPlan(page, 0.5, 0.35);
  const end = await pointOnPlan(page, 0.5, 0.65);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator("[data-wall-id]")).toHaveCount(initialWalls + 1);
  await expect(page.locator("[data-wall-id].is-partition")).toHaveCount(1);
  await expect(page.locator("[data-wall-id].is-partition")).toHaveAttribute("data-raised", "true");

  await page.locator('[data-build-tool="draw-surface"]').click();
  const zonePoints: Array<[number, number]> = [[0.35, 0.45], [0.65, 0.45], [0.65, 0.55], [0.35, 0.55]];
  for (const [x, z] of zonePoints) {
    const point = await pointOnPlan(page, x, z);
    await page.mouse.click(point.x, point.y);
  }
  await page.getByRole("button", { name: /Close surface polygon/i }).click();
  await expect(page.locator("[data-surface-zone-id]")).toHaveCount(1);

  await page.locator('[data-build-tool="place-column"]').click();
  const columnPoint = await pointOnPlan(page, 0.25, 0.5);
  await page.mouse.click(columnPoint.x, columnPoint.y);
  await expect(page.locator("[data-object-id]").filter({ has: page.locator(".lr-column-symbol") })).toHaveCount(1);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
});
