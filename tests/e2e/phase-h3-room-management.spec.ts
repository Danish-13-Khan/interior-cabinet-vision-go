import { expect, test, type Page } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

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
  test.setTimeout(60_000);
  await createShellPlan(page);
  await splitRoom(page);

  await page.getByTestId("build-room-delete-open").click();
  const dialog = page.getByRole("alertdialog", { name: "Delete room?" });
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId("build-room-delete-message")).toContainText(/Delete "/);
  await page.getByTestId("build-room-delete-confirm").click();
  await expect(page.locator('[data-testid="build-room-switcher"] [role="tab"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator('[data-testid="build-room-switcher"] [role="tab"]')).toHaveCount(2);

  const tabs = page.locator('[data-testid="build-room-switcher"] [role="tab"]');
  await tabs.nth(1).click();
  await page.locator('[data-testid="build-room-merge-select"]').selectOption({ index: 1 });
  await page.getByTestId("build-room-merge-confirm").click();
  await expect(tabs).toHaveCount(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator('[data-testid="build-room-switcher"] [role="tab"]')).toHaveCount(2);
});

test("H3 modal keyboard isolation: Ctrl+Z does not undo while delete confirm is open", async ({ page }) => {
  test.setTimeout(60_000);
  await createShellPlan(page);
  await splitRoom(page);

  const tabs = page.locator('[data-testid="build-room-switcher"] [role="tab"]');
  await expect(tabs).toHaveCount(2);

  await page.getByTestId("build-room-delete-open").click();
  const dialog = page.getByRole("alertdialog", { name: "Delete room?" });
  await expect(dialog).toBeVisible();

  const confirm = page.getByTestId("build-room-delete-confirm");
  await expect(confirm).toHaveClass(/is-danger/);
  const bg = await confirm.evaluate((node) => getComputedStyle(node).backgroundColor);
  // Danger red #8f2f2f → rgb(143, 47, 47)
  expect(bg).toMatch(/rgb\(\s*143,\s*47,\s*47\s*\)/);

  await page.keyboard.press("Control+z");
  await expect(dialog).toBeVisible();
  await expect(tabs).toHaveCount(2);

  await page.keyboard.press("Meta+z");
  await expect(dialog).toBeVisible();
  await expect(tabs).toHaveCount(2);

  await page.getByTestId("build-room-delete-cancel").click();
  await expect(dialog).toHaveCount(0);
  await expect(tabs).toHaveCount(2);
});
