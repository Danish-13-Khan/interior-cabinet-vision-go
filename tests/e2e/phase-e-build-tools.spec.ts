import { expect, test, type Page } from "@playwright/test";

async function openPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
}

async function planPoint(page: Page, x: number, z: number) {
  return page.locator('svg[aria-label="Living room plan editor"]').evaluate((svg, point) => {
    const matrix = (svg as SVGSVGElement).getScreenCTM();
    if (!matrix) throw new Error("Plan SVG has no screen matrix");
    const screen = new DOMPoint(point.x, point.z).matrixTransform(matrix);
    return { x: screen.x, y: screen.y };
  }, { x, z });
}

test("Phase E draws a surface zone, partition wall, and column", async ({ page }) => {
  await openPlan(page);
  const initialWalls = await page.locator("[data-wall-id]").count();

  await page.locator('[data-build-tool="draw-wall"]').click();
  await page.locator('[data-build-tool="draw-partition"]').click();
  const start = await planPoint(page, 0, -1000);
  const end = await planPoint(page, 0, 1000);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator("[data-wall-id]")).toHaveCount(initialWalls + 1);
  await expect(page.locator("[data-wall-id].is-partition")).toHaveCount(1);
  await expect(page.locator("[data-wall-id].is-partition")).toHaveAttribute("data-raised", "true");

  await page.locator('[data-build-tool="draw-surface"]').click();
  const zonePoints: Array<[number, number]> = [[-900, -300], [900, -300], [900, 300], [-900, 300]];
  for (const [x, z] of zonePoints) {
    const point = await planPoint(page, x, z);
    await page.mouse.click(point.x, point.y);
  }
  await page.getByRole("button", { name: /Close surface polygon/i }).click();
  await expect(page.locator("[data-surface-zone-id]")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Delete surface zone" })).toBeVisible();

  await page.getByTestId("interiors-tool-select").click();
  await page.locator(".lr-room-switcher-tabs button.is-active").click();
  await expect(page.locator(".lr-architecture-inspector").getByRole("heading", { name: "Room" })).toBeVisible();

  await page.locator('[data-build-tool="draw-wall"]').click();
  await page.locator('[data-build-tool="place-column"]').click();
  const columnPoint = await planPoint(page, -1500, 0);
  await page.mouse.click(columnPoint.x, columnPoint.y);
  await expect(page.locator("[data-object-id]").filter({ has: page.locator(".lr-column-symbol") })).toHaveCount(1);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
});
