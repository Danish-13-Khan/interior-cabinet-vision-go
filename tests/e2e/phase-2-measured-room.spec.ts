import { expect, test, type Page } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

/** 1×1 PNG */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function planPoint(page: Page, x: number, z: number) {
  return page.getByTestId("lr-plan-svg").evaluate((svg, point) => {
    const matrix = (svg as SVGSVGElement).getScreenCTM();
    if (!matrix) throw new Error("Plan SVG has no screen matrix");
    const screen = new DOMPoint(point.x, point.z).matrixTransform(matrix);
    return { x: screen.x, y: screen.y };
  }, { x, z });
}

async function openImportPanel(page: Page) {
  const importTool = page.getByRole("button", { name: "Import plan", exact: true });
  await expect(importTool).toBeVisible();
  await importTool.click();
  await expect(page.getByTestId("lr-underlay-empty").or(page.getByTestId("lr-underlay-controls"))).toBeVisible();
}

test.describe("Phase 2 measured room", () => {
  test("calibrate without underlay shows blocked hint", async ({ page }) => {
    await createShellPlan(page);
    await page.getByTestId("fit-plan").first().click();
    const calibrate = page.locator("[data-build-tool=calibrate-underlay]").first();
    await expect(calibrate).toBeVisible();
    await calibrate.click();
    await expect(page.locator(".lr-plan-svg.is-calibrate")).toBeVisible();
    await expect(page.getByTestId("lr-calibrate-blocked")).toContainText(/import/i);
  });

  test("import → calibrate → lock → hide underlay", async ({ page }) => {
    test.setTimeout(90_000);
    await createShellPlan(page);
    await page.getByTestId("fit-plan").first().click();
    await openImportPanel(page);

    const fileInput = page.locator('input[type="file"][accept*="image/png"]').first();
    await fileInput.setInputFiles({
      name: "site-plan.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    });

    await expect(page.getByTestId("lr-underlay-controls")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("lr-underlay-calibrated-chip")).toContainText(/Not calibrated/i);
    await expect(page.getByTestId("lr-plan-underlay-image")).toBeVisible();

    const widthBefore = await page.locator('input[aria-label="Underlay calibrated width"]').inputValue();

    await page.getByTestId("lr-underlay-calibrate").click();
    await expect(page.locator(".lr-plan-svg.is-calibrate")).toBeVisible();

    const a = await planPoint(page, -800, 0);
    const b = await planPoint(page, 800, 0);
    await page.mouse.click(a.x, a.y);
    await expect(page.getByTestId("lr-calibrate-point")).toHaveCount(1);
    await page.mouse.click(b.x, b.y);
    await expect(page.getByTestId("calibrate-known-length")).toBeVisible();
    await page.getByTestId("calibrate-known-length-input").fill("3200");
    await page.getByTestId("calibrate-known-length-confirm").click();

    await expect(page.getByTestId("lr-underlay-calibrated-chip")).toContainText(/Calibrated/i, {
      timeout: 10_000,
    });
    const widthAfter = await page.locator('input[aria-label="Underlay calibrated width"]').inputValue();
    expect(Number(widthAfter)).not.toBe(Number(widthBefore));

    await openImportPanel(page);
    await page.getByTestId("lr-underlay-lock-toggle").click();
    await expect(page.getByTestId("lr-underlay-locked-chip")).toBeVisible();
    await expect(page.locator('input[aria-label="Underlay calibrated width"]')).toBeDisabled();
    await expect(page.getByTestId("lr-underlay-calibrate")).toBeDisabled();

    await page.getByTestId("lr-underlay-hide-toggle").click();
    await expect(page.getByTestId("lr-underlay-hidden-chip")).toBeVisible();
    await expect(page.getByTestId("lr-plan-underlay-image")).toHaveCount(0);

    await expect(page.getByTestId("lr-site-measure-checklist")).toBeVisible();
    await expect(page.getByTestId("lr-site-check-underlayImported")).toBeChecked();
    await expect(page.getByTestId("lr-site-check-underlayCalibrated")).toBeChecked();
  });

  test("calibrate rejected known length shows dialog error", async ({ page }) => {
    test.setTimeout(90_000);
    await createShellPlan(page);
    await page.getByTestId("fit-plan").first().click();
    await openImportPanel(page);

    const fileInput = page.locator('input[type="file"][accept*="image/png"]').first();
    await fileInput.setInputFiles({
      name: "site-plan.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    });

    await expect(page.getByTestId("lr-underlay-controls")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("lr-underlay-calibrate").click();
    await expect(page.locator(".lr-plan-svg.is-calibrate")).toBeVisible();

    const a = await planPoint(page, -800, 0);
    const b = await planPoint(page, 800, 0);
    await page.mouse.click(a.x, a.y);
    await expect(page.getByTestId("lr-calibrate-point")).toHaveCount(1);
    await page.mouse.click(b.x, b.y);
    await expect(page.getByTestId("calibrate-known-length")).toBeVisible();
    await page.getByTestId("calibrate-known-length-input").fill("-3200");
    await page.getByTestId("calibrate-known-length-confirm").click();

    await expect(page.getByTestId("calibrate-known-length-error")).toBeVisible();
    await expect(page.getByTestId("calibrate-known-length-error")).toContainText(/known length/i);
    await expect(page.getByTestId("calibrate-known-length")).toBeVisible();
  });

});