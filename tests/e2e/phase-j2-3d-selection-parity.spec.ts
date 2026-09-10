import { expect, test, type Page } from "@playwright/test";
import { clickInteriorsTool, createShellPlan } from "./plannerStart";

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";
const OAK_ID = "lr-material-natural-oak";
const CABINET_NAME = "Base Cabinet · 900";

async function openDesign(page: Page) {
  await createShellPlan(page, { localStorage: { [GUIDE_KEY]: "dismissed" } });
  await clickInteriorsTool(page, "cabinet");
}

async function clearModelSelection(page: Page) {
  const clear = page.getByTestId("model-clear-selection");
  if (await clear.count() === 0) return;
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

async function fitRoom(page: Page) {
  await page.getByTestId("model-fit-room").click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
}

/** Top framing (ceiling hidden) keeps wall-backed cabinets first-hit. */
async function frameForObjectPick(page: Page) {
  await page.getByTestId("model-view-top").click();
  await expect(page.getByTestId("lr-model-viewport")).toHaveAttribute("data-view-preset", "top");
}

/** The starter window is hosted by the left wall; its elevation is a deterministic first-hit view. */
async function frameForOpeningPick(page: Page) {
  await page.getByTestId("model-view-side").click();
  await expect(page.getByTestId("lr-model-viewport")).toHaveAttribute("data-view-preset", "side");
  await fitRoom(page);
}

async function pickMesh(page: Page, pickId: string) {
  const ready = () => page.evaluate((id) => Boolean(window.__lrModelPickApi?.raycastHitsPickId(id)), pickId);
  if (!(await ready())) {
    await fitRoom(page);
  }
  await expect.poll(ready, { timeout: 15_000 }).toBe(true);
  const point = await page.evaluate((id) => window.__lrModelPickApi!.screenPointForPickId(id), pickId);
  expect(point).toBeTruthy();
  await page.mouse.click(point!.x, point!.y);
}

async function pickLabel(page: Page, name: string) {
  const pick = page.locator(".lr-model-viewport").getByRole("button", { name: `Select ${name}`, exact: true });
  await expect(pick).toBeVisible({ timeout: 15_000 });
  await pick.click();
}

async function selectPlanOpening(page: Page, openingId: string) {
  await page.locator(`[data-opening-id="${openingId}"] .lr-opening-hit`).click({ force: true });
}

async function expectObjectSelected(inspector: ReturnType<Page["locator"]>) {
  await expect(inspector.locator(".lr-object-identity")).toBeVisible({ timeout: 10_000 });
}

async function expectOpeningSelected(inspector: ReturnType<Page["locator"]>) {
  await expect(inspector.getByRole("heading", { name: "Selected Opening", exact: true })).toBeVisible({ timeout: 10_000 });
}

test("J2 keeps an opening selection isolated from its host wall", async ({ page }) => {
  await openDesign(page);
  await selectPlanOpening(page, "lr-opening-picture-window");
  await page.getByRole("button", { name: "3D", exact: true }).click();

  const inspector = page.locator(".lr-inspector");
  await expectOpeningSelected(inspector);
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
  await expect(page.getByTestId("model-focus-selection")).toBeEnabled();
  await expectObjectSelected(inspector);
  await setCutaway(page, true);

  await clearModelSelection(page);
  await expect(inspector.locator(".lr-object-identity")).toHaveCount(0);

  await frameForObjectPick(page);
  await pickMesh(page, objectId!);
  await expectObjectSelected(inspector);
  const objectGizmo = page.getByTestId("model-move-gizmo-readout");
  await expect(objectGizmo).toBeVisible();
  await expect(objectGizmo).toHaveAttribute("data-target-kind", "object");
  await expect(objectGizmo).toHaveAttribute("data-target-id", objectId!);
  await expect(inspector.getByRole("spinbutton", { name: "X mm", exact: true })).toBeVisible();
  await expect(inspector.getByRole("spinbutton", { name: "Y mm", exact: true })).toBeVisible();
  await expect(inspector.getByRole("spinbutton", { name: "Z mm", exact: true })).toBeVisible();

  // Leave object framing before room-scale picks; gizmo/label steal rays otherwise.
  await clearModelSelection(page);
  await frameForOpeningPick(page);
  await setCutaway(page, false);
  await pickMesh(page, openingId!);
  await expectOpeningSelected(inspector);
  const openingGizmo = page.getByTestId("model-move-gizmo-readout");
  await expect(openingGizmo).toHaveAttribute("data-target-kind", "opening");
  await expect(openingGizmo).toHaveAttribute("data-target-id", openingId!);
  await expect(inspector.getByRole("spinbutton", { name: "D mm", exact: true })).toBeVisible();
  await expect(inspector.locator(".lr-object-identity")).toHaveCount(0);
  await expect(page.locator('[data-model-select="wall"].is-selected')).toHaveCount(0);
  await expect(inspector.locator(".lr-wall-inspector")).toHaveCount(0);

  await pickLabel(page, "Fixed Window");
  await expectOpeningSelected(inspector);
  await expect(page.locator('[data-model-select="wall"].is-selected')).toHaveCount(0);

  await pickMesh(page, "lr-wall-left");
  await page.mouse.move(50, 50);
  await expect(page.locator('[data-model-select="wall"].is-selected')).toHaveCount(1);
  await expect(page.locator(".inspector-header strong")).toBeVisible();
  await expect(inspector.getByRole("heading", { name: "Selected Opening", exact: true })).toHaveCount(0);
  await expect(page.locator('[data-model-select="opening"].is-selected')).toHaveCount(0);

  await clearModelSelection(page);
  await setCutaway(page, true);
  await frameForObjectPick(page);
  await pickMesh(page, objectId!);
  await expectObjectSelected(inspector);
  await pickLabel(page, CABINET_NAME);
  await expectObjectSelected(inspector);

  const width = inspector.getByRole("spinbutton", { name: "W mm", exact: true });
  await width.fill("1000");
  await width.blur();
  await expect(width).toHaveValue("1000");

  await clearModelSelection(page);
  await frameForOpeningPick(page);
  await setCutaway(page, false);
  await pickMesh(page, openingId!);
  const frame = inspector.locator('[data-material-slot="frame"]');
  await frame.locator(`[data-material-id="${OAK_ID}"]`).click();
  await expect(frame.locator(`[data-material-id="${OAK_ID}"]`)).toHaveClass(/is-active/);

  await clearModelSelection(page);
  await expect(inspector.getByRole("heading", { name: "Selected Opening", exact: true })).toHaveCount(0);
  await expect(inspector.locator(".lr-object-identity")).toHaveCount(0);
});
