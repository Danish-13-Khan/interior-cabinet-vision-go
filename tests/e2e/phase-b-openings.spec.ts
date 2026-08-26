import { expect, test, type Locator, type Page } from "@playwright/test";

async function numericAttribute(locator: Locator, name: string) {
  return Number(await locator.getAttribute(name));
}

async function dragAlongWall(page: Page, target: Locator, wall: Locator, pixels: number) {
  const targetBox = await target.boundingBox();
  const wallBox = await wall.boundingBox();
  if (!targetBox || !wallBox) throw new Error("Opening or wall is not rendered");
  const start = { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 };
  const horizontal = wallBox.width >= wallBox.height;
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + (horizontal ? pixels : 0), start.y + (horizontal ? 0 : pixels), { steps: 6 });
  await page.mouse.up();
}

test("Phase B opening workflow places, manipulates, inspects, undoes, and recompiles", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: "Create a room", exact: true }).click();

  await page.locator('[data-build-tool="place-door"]').click();
  await page.locator('[data-catalog-item="opening:door-double"]').click();

  const wall = page.locator('[data-wall-id="lr-wall-back"]');
  const wallBox = await wall.boundingBox();
  if (!wallBox) throw new Error("Back wall is not rendered");
  await page.mouse.click(wallBox.x + wallBox.width * 0.52, wallBox.y + wallBox.height * 0.52);

  const opening = page.locator('[data-opening-id][data-catalog-item="opening:door-double"]');
  await expect(opening).toHaveCount(1);
  await expect(opening).toHaveAttribute("data-width-mm", "1600");
  const inspector = page.locator(".lr-opening-inspector");
  await expect(inspector.getByText("Double Swing Door", { exact: true })).toBeVisible();
  await expect(inspector.getByRole("spinbutton", { name: "W mm", exact: true })).toHaveValue("1600");
  await expect(inspector.getByRole("spinbutton", { name: "H mm", exact: true })).toHaveValue("2200");
  await expect(inspector.getByRole("spinbutton", { name: "Sill mm", exact: true })).toHaveValue("0");
  await expect(inspector.locator(".lr-material-slots select")).toHaveCount(3);

  const initialOffset = await numericAttribute(opening, "data-offset-mm");
  await dragAlongWall(page, opening.locator("line").first(), wall, 55);
  await expect.poll(() => numericAttribute(opening, "data-offset-mm")).not.toBe(initialOffset);

  const widthHandle = opening.locator(".lr-opening-width-handle-end");
  await dragAlongWall(page, widthHandle, wall, 45);
  const resizedWidth = await numericAttribute(opening, "data-width-mm");
  expect(resizedWidth).toBeGreaterThan(1600);
  const widthField = inspector.getByRole("spinbutton", { name: "W mm", exact: true });
  await expect(widthField).toHaveValue(String(resizedWidth));

  const undo = page.locator(".lr-build-history").getByRole("button", { name: "Undo" });
  const redo = page.locator(".lr-build-history").getByRole("button", { name: "Redo" });
  await undo.click();
  await expect(opening).toHaveAttribute("data-width-mm", "1600");
  await redo.click();
  await expect(opening).toHaveAttribute("data-width-mm", String(resizedWidth));

  await inspector.getByRole("combobox", { name: "leaf", exact: true }).selectOption({ label: "Natural Oak" });
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  await expect(page.locator(".lr-model-viewport canvas")).toBeVisible();

  await page.getByRole("button", { name: "2D", exact: true }).click();
  await page.getByRole("button", { name: "Remove opening" }).click();
  await expect(opening).toHaveCount(0);
  await undo.click();
  await expect(opening).toHaveCount(1);
});
