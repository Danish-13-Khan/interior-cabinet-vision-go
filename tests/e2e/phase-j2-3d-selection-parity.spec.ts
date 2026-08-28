import { expect, test, type Locator, type Page } from "@playwright/test";

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";
const OAK_ID = "lr-material-natural-oak";

async function openDesign(page: Page) {
  await page.addInitScript((key) => {
    window.localStorage.clear();
    window.localStorage.setItem(key, "dismissed");
  }, GUIDE_KEY);
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: "Create a room", exact: true }).click();
  await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
}

async function pointBelow(label: Locator, pixels = 28) {
  await expect(label).toBeVisible({ timeout: 15_000 });
  const box = await label.boundingBox();
  if (!box) throw new Error("Selected 3D label is not rendered");
  return { x: box.x + box.width / 2, y: box.y + box.height + pixels };
}

async function clickVisibleFloor(page: Page) {
  const box = await page.locator(".lr-model-viewport canvas").boundingBox();
  if (!box) throw new Error("3D canvas is not rendered");
  // Keep clear of the bottom-left style palette and bottom-right diagnostics.
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.68);
}

test("J2 selects, switches, clears, and edits entities in 3D", async ({ page }) => {
  test.setTimeout(60_000);
  await openDesign(page);

  await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
  const object = page.locator("[data-object-id]").first();
  await object.click();
  await page.getByRole("button", { name: "3D", exact: true }).click();

  const inspector = page.locator(".lr-inspector");
  await expect(inspector.getByText("Model Properties", { exact: true })).toBeVisible();
  await expect(inspector.getByText("Selected Object", { exact: true })).toBeVisible();
  const objectLabel = page.locator(".lr-model-object-label").filter({ hasText: "Base Cabinet" });
  const objectPoint = await pointBelow(objectLabel);
  await clickVisibleFloor(page);
  await expect(inspector.getByText("Selected Object", { exact: true })).toHaveCount(0);

  await page.mouse.click(objectPoint.x, objectPoint.y);
  await expect(inspector.getByText("Selected Object", { exact: true })).toBeVisible();
  const width = inspector.getByRole("spinbutton", { name: "W mm", exact: true });
  await width.fill("1000");
  await width.blur();
  await expect(width).toHaveValue("1000");

  await page.getByRole("button", { name: "2D", exact: true }).click();
  const opening = page.locator('[data-opening-id="lr-opening-picture-window"]');
  // A vertical SVG line has a zero-width bounding box, so Playwright treats it
  // as invisible. The rendered opening label is a stable, clickable child of
  // the same pointer-enabled group.
  await opening.locator("text").click();
  await page.getByRole("button", { name: "3D", exact: true }).click();

  await expect(inspector.getByText("Opening selected", { exact: true })).toBeVisible();
  await expect(inspector.getByText("Selected Opening", { exact: true })).toBeVisible();
  const openingLabel = page.locator(".lr-model-object-label").filter({ hasText: "Fixed Window" });
  const openingPoint = await pointBelow(openingLabel, 20);

  await page.mouse.click(objectPoint.x, objectPoint.y);
  await expect(inspector.getByText("Selected Object", { exact: true })).toBeVisible();
  await page.mouse.click(openingPoint.x, openingPoint.y);
  await expect(inspector.getByText("Selected Opening", { exact: true })).toBeVisible();

  const frame = inspector.locator('[data-material-slot="frame"]');
  await frame.locator(`[data-material-id="${OAK_ID}"]`).click();
  await expect(frame.locator(`[data-material-id="${OAK_ID}"]`)).toHaveClass(/is-active/);
  await clickVisibleFloor(page);
  await expect(inspector.getByText("Selected Opening", { exact: true })).toHaveCount(0);
});
