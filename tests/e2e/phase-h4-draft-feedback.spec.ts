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

test("H4 shows live dimensions and guides while drawing a wall", async ({ page }) => {
  await openPlan(page);
  await page.locator('[data-build-tool="draw-wall"]').click();
  const start = await planPoint(page, 0, -1200);
  const end = await planPoint(page, 0, 1200);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await expect(page.locator(".lr-draft-feedback")).toBeVisible();
  await expect(page.locator(".lr-draft-guide")).toHaveCount(2);
  await expect(page.locator(".lr-draft-length")).toContainText("mm");
  await page.mouse.up();
});

test("H4 shows feedback while drawing a room", async ({ page }) => {
  await openPlan(page);
  await page.locator('[data-build-tool="draw-room"]').click();
  const roomStart = await planPoint(page, -1200, -900);
  const roomEnd = await planPoint(page, 1200, 900);
  await page.mouse.move(roomStart.x, roomStart.y);
  await page.mouse.down();
  await page.mouse.move(roomEnd.x, roomEnd.y, { steps: 5 });
  await expect(page.locator(".lr-draft-feedback")).toBeVisible();
  await expect(page.locator(".lr-draft-length")).toContainText("×");
  await page.mouse.up();
});

test("H4 shows feedback while dragging an editable wall node", async ({ page }) => {
  await openPlan(page);
  await page.locator('[data-build-tool="select"]').click();
  const node = page.locator("[data-node-id]").first();
  const box = await node.boundingBox();
  if (!box) throw new Error("Node handle is not rendered");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50, { steps: 4 });
  await expect(page.locator(".lr-draft-feedback")).toBeVisible();
  await page.mouse.up();
});
