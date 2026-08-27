import { expect, test, type Page } from "@playwright/test";

async function openPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: "Create a room", exact: true }).click();
}

async function planPoint(page: Page, x: number, z: number) {
  return page.locator('svg[aria-label="Living room plan editor"]').evaluate((svg, point) => {
    const matrix = (svg as SVGSVGElement).getScreenCTM();
    if (!matrix) throw new Error("Plan SVG has no screen matrix");
    const screen = new DOMPoint(point.x, point.z).matrixTransform(matrix);
    return { x: screen.x, y: screen.y };
  }, { x, z });
}

async function splitRoom(page: Page) {
  await page.locator('[data-build-tool="draw-wall"]').click();
  const start = await planPoint(page, 0, -2300);
  const end = await planPoint(page, 0, 2300);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
  await page.locator('[data-build-tool="select"]').click();
  await expect(page.locator('[data-testid="build-room-switcher"] [role="tab"]')).toHaveCount(2);
}

test("H3 deletes and merges rooms with undo", async ({ page }) => {
  await openPlan(page);
  await splitRoom(page);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete room", exact: true }).click();
  await expect(page.locator('[data-testid="build-room-switcher"] [role="tab"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator('[data-testid="build-room-switcher"] [role="tab"]')).toHaveCount(2);

  const tabs = page.locator('[data-testid="build-room-switcher"] [role="tab"]');
  await tabs.nth(1).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator('[data-testid="build-room-switcher"] select').selectOption({ index: 1 });
  await expect(tabs).toHaveCount(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator('[data-testid="build-room-switcher"] [role="tab"]')).toHaveCount(2);
});
