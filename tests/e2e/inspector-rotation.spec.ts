import { expect, test, type Page } from "@playwright/test";
import { GOLDEN_RUN_OBJECT_IDS } from "../../src/domain/livingRoom/goldenRun";
import { openGoldenCabinetRun, selectGoldenCabinet } from "./golden-cabinet-run.helpers";
import { loadReleaseDemo, openInteriorsHome } from "./plannerStart";

async function openPositionEditor(page: Page) {
  const editor = page.locator(".lr-transform-editor").first();
  if (await editor.getAttribute("open") === null) await editor.locator("summary").click();
  await expect(page.getByTestId("inspector-rotation-input")).toBeVisible();
}

async function typeRotation(page: Page, value: string) {
  const input = page.getByTestId("inspector-rotation-input");
  await input.fill(value);
  await input.press("Enter");
}

test.describe("Inspector rotation (Phases 0 and 2)", () => {
  test("a chair shows its stored angle and keeps a typed 37°", async ({ page }) => {
    await openInteriorsHome(page);
    await loadReleaseDemo(page);
    const chair = page.locator('.lr-plan-svg [data-catalog-item-id="living:lounge-chair"]');
    await chair.click();
    await expect(chair).toHaveClass(/is-selected/);
    await openPositionEditor(page);
    const input = page.getByTestId("inspector-rotation-input");
    await expect(input).toHaveValue("30");
    await expect(page.getByTestId("inspector-rotation-hint")).toHaveCount(0);
    await typeRotation(page, "37");
    await expect(chair).toHaveAttribute("data-rotation-y", "37");
    await expect(input).toHaveValue("37");
    await page.getByTestId("inspector-rotate-right").click();
    await expect(chair).toHaveAttribute("data-rotation-y", "127");
  });

  test("a cabinet steps in 90° with the production hint", async ({ page }) => {
    await openGoldenCabinetRun(page);
    const id = GOLDEN_RUN_OBJECT_IDS.baseA;
    await selectGoldenCabinet(page, id);
    const cabinet = page.locator(`.lr-plan-svg [data-object-id="${id}"]`);
    await openPositionEditor(page);
    await expect(page.getByTestId("inspector-rotation-hint")).toContainText("90° steps");
    const before = Number(await cabinet.getAttribute("data-rotation-y"));
    await typeRotation(page, String(before + 37));
    await expect(cabinet).toHaveAttribute("data-rotation-y", String(before));
    await expect(page.getByTestId("inspector-rotation-input")).toHaveValue(String(before));
    await page.getByTestId("inspector-rotate-right").click();
    await expect(cabinet).toHaveAttribute("data-rotation-y", String((before + 90) % 360));
  });

  test("Shaker and Glass are labelled plan only; door count is automatic", async ({ page }) => {
    await openGoldenCabinetRun(page);
    await selectGoldenCabinet(page, GOLDEN_RUN_OBJECT_IDS.baseA);
    const advanced = page.getByTestId("inspector-cabinet-advanced");
    if (await advanced.getAttribute("open") === null) await advanced.locator("summary").click();
    const style = page.getByTestId("cabinet-door-style");
    await expect(style.locator('option[value="shaker"]')).toHaveText("Shaker (plan only)");
    await expect(style.locator('option[value="glass"]')).toHaveText("Glass (plan only)");
    await expect(page.getByTestId("cabinet-door-count-auto")).toBeVisible();
  });
});
