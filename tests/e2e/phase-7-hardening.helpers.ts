import { expect, type Page } from "@playwright/test";
import { LIVING_ROOM_RECOVERY_STORAGE_KEY } from "../../src/domain/livingRoom";
import { E2E_SESSION_JSON, loadGoldenCabinetRun } from "./plannerStart";

export const TABLET_VIEWPORT = { width: 1024, height: 768 };

export function undoChord() {
  return "ControlOrMeta+KeyZ";
}

export function redoChord() {
  return "ControlOrMeta+Shift+KeyZ";
}

export function cabinetWidthNode(page: Page, objectId: string) {
  return page.locator(`[data-object-id="${objectId}"][data-width-mm]`).first();
}

export async function dismiss3dGuideIfVisible(page: Page) {
  const guide = page.getByRole("region", { name: "Welcome to the 3D room" });
  if (await guide.count()) {
    await guide.getByRole("button", { name: "Start exploring" }).click();
    await expect(guide).toBeHidden();
  }
}

export async function assertPresentTabletLayout(page: Page) {
  const panel = page.getByTestId("interiors-present-panel");
  const canvas = page.getByTestId("lr-model-viewport");
  await expect(panel).toBeVisible();
  await expect(canvas).toBeVisible();
  const panelBox = await panel.boundingBox();
  const canvasBox = await canvas.boundingBox();
  expect(panelBox).toBeTruthy();
  expect(canvasBox).toBeTruthy();
  expect(panelBox!.width).toBeGreaterThan(canvasBox!.width * 0.55);
  expect(canvasBox!.height).toBeGreaterThan(220);
}

export async function waitForRecoveryAutosave(page: Page) {
  await expect.poll(
    () => page.evaluate((key) => window.localStorage.getItem(key), LIVING_ROOM_RECOVERY_STORAGE_KEY),
    { timeout: 8_000 },
  ).toBeTruthy();
}

/** Clear storage once, then open Golden without an init script that wipes recovery on reload. */
export async function openGoldenCabinetRunForRecovery(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("golden-scene-semantics", "1");
  });
  await page.goto("/app");
  await page.evaluate((session) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.sessionStorage.setItem("golden-scene-semantics", "1");
    window.localStorage.setItem("cabinetStudioSession", session);
  }, E2E_SESSION_JSON);
  await page.reload();
  await page.getByRole("button", { name: "Interiors" }).click();
  await loadGoldenCabinetRun(page);
  await expect(page.getByTestId("interiors-project-crumb")).toContainText("Golden Cabinet Run");
}

export async function assertProjectsFocusTrap(page: Page) {
  const dialog = page.getByTestId("interiors-projects-home");
  const jobName = page.getByTestId("interiors-job-name");
  await expect(dialog).toBeVisible();
  await expect(jobName).toBeFocused({ timeout: 5_000 });
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("interiors-new-job")).toBeFocused();
  await expect(page.getByTestId("interiors-workspace-header")).toHaveAttribute("aria-hidden", "true");
}

/** Keep focus on a later dialog control across parent autosave rerenders. */
export async function assertProjectsFocusSurvivesAutosaveRerender(page: Page) {
  const openButton = page.getByRole("button", { name: "Open project", exact: true });
  await expect(page.getByTestId("interiors-job-name")).toBeFocused({ timeout: 5_000 });
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(openButton).toBeFocused();
  await page.clock.fastForward(1_200);
  await waitForRecoveryAutosave(page);
  await expect(openButton).toBeFocused();
}
