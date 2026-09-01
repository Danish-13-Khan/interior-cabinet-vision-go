import { expect, test, type Page } from "@playwright/test";

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";
const OAK_ID = "lr-material-natural-oak";

async function openDesign(page: Page) {
  await page.addInitScript((key) => {
    window.localStorage.clear();
    window.localStorage.setItem(key, "dismissed");
  }, GUIDE_KEY);
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
  await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
}

async function clearModelSelection(page: Page) {
  const clear = page.getByTestId("model-clear-selection");
  await expect(clear).toBeVisible();
  await clear.click();
  await expect(clear).toHaveCount(0);
}

async function setCutaway(page: Page, enabled: boolean) {
  const cutaway = page.getByRole("button", { name: "Cutaway", exact: true });
  const isOn = await cutaway.evaluate((button) => button.classList.contains("is-active"));
  if (isOn !== enabled) await cutaway.click();
  if (enabled) await expect(cutaway).toHaveClass(/is-active/);
  else await expect(cutaway).not.toHaveClass(/is-active/);
}

/** Real canvas click at the harness-projected mesh point (goes through R3F handlers). */
async function pickMesh(page: Page, pickId: string) {
  await expect.poll(
    () => page.evaluate((id) => Boolean(window.__lrModelPickApi?.screenPointForPickId(id)), pickId),
    { timeout: 15_000 },
  ).toBe(true);
  const point = await page.evaluate((id) => window.__lrModelPickApi!.screenPointForPickId(id), pickId);
  expect(point).toBeTruthy();
  await page.mouse.click(point!.x, point!.y);
}

async function pickLabel(page: Page, name: string) {
  const pick = page.locator(".lr-model-viewport").getByRole("button", { name: `Select ${name}`, exact: true });
  await expect(pick).toBeVisible({ timeout: 15_000 });
  await pick.click();
}

test("J2 keeps an opening selection isolated from its host wall", async ({ page }) => {
  await openDesign(page);
  await page.locator('[data-opening-id="lr-opening-picture-window"]').click();
  await page.getByRole("button", { name: "3D", exact: true }).click();

  const inspector = page.locator(".lr-inspector");
  await expect(inspector.getByText("Selected Opening", { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-model-select="wall"].is-selected')).toHaveCount(0);
  await expect(inspector.locator(".lr-wall-inspector")).toHaveCount(0);
});

test("J2 selects via mesh and label, clears, and edits entities in 3D", async ({ page }) => {
  test.setTimeout(90_000);
  await openDesign(page);

  await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
  const selectedPlanObject = page.locator("[data-object-id].is-selected").first();
  const objectId = await selectedPlanObject.getAttribute("data-object-id");
  expect(objectId).toBeTruthy();
  const openingId = await page.locator('[data-opening-id="lr-opening-picture-window"]').getAttribute("data-opening-id");
  expect(openingId).toBeTruthy();

  await page.getByRole("button", { name: "3D", exact: true }).click();
  const inspector = page.locator(".lr-inspector");
  await expect(inspector.getByText("Selected Object", { exact: true })).toBeVisible();
  await setCutaway(page, true);

  await clearModelSelection(page);
  await expect(inspector.getByText("Selected Object", { exact: true })).toHaveCount(0);

  await pickMesh(page, objectId!);
  await expect(inspector.getByText("Selected Object", { exact: true })).toBeVisible({ timeout: 10_000 });

  await setCutaway(page, false);
  await pickMesh(page, openingId!);
  await expect(inspector.getByText("Selected Opening", { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(inspector.getByText("Selected Object", { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-model-select="wall"].is-selected')).toHaveCount(0);
  await expect(inspector.locator(".lr-wall-inspector")).toHaveCount(0);

  await pickLabel(page, "Fixed Window");
  await expect(inspector.getByText("Selected Opening", { exact: true })).toBeVisible();
  await expect(page.locator('[data-model-select="wall"].is-selected')).toHaveCount(0);

  await pickMesh(page, "lr-wall-left");
  await page.mouse.move(50, 50);
  await expect(page.locator(".inspector-header")).toContainText("Wall selected");
  await expect(inspector.getByText("Selected Opening", { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-model-select="opening"].is-selected')).toHaveCount(0);
  await expect(page.locator('[data-model-select="wall"].is-selected')).toHaveCount(1);

  await setCutaway(page, true);
  await pickMesh(page, objectId!);
  await expect(inspector.getByText("Selected Object", { exact: true })).toBeVisible({ timeout: 10_000 });
  await pickLabel(page, "Base Cabinet · 900");
  await expect(inspector.getByText("Selected Object", { exact: true })).toBeVisible();

  const width = inspector.getByRole("spinbutton", { name: "W mm", exact: true });
  await width.fill("1000");
  await width.blur();
  await expect(width).toHaveValue("1000");

  await setCutaway(page, false);
  await pickMesh(page, openingId!);
  const frame = inspector.locator('[data-material-slot="frame"]');
  await frame.locator(`[data-material-id="${OAK_ID}"]`).click();
  await expect(frame.locator(`[data-material-id="${OAK_ID}"]`)).toHaveClass(/is-active/);

  await clearModelSelection(page);
  await expect(inspector.getByText("Selected Opening", { exact: true })).toHaveCount(0);
  await expect(inspector.getByText("Selected Object", { exact: true })).toHaveCount(0);
});
