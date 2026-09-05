import { expect, test } from "@playwright/test";
import { openGoldenCabinetRun } from "./golden-cabinet-run.helpers";

test.describe("Phase 4 plan presentation", () => {
  test("Sales/Technical presets, layer toggles, and export control on golden plan", async ({ page }) => {
    test.setTimeout(90_000);
    await openGoldenCabinetRun(page);

    await page.getByTestId("interiors-tool-select").click();
    const toolbar = page.getByTestId("lr-print-export-toolbar").first();
    await expect(toolbar).toBeVisible({ timeout: 15_000 });

    await expect(toolbar.getByTestId("lr-print-preset-sales")).toBeVisible();
    await expect(toolbar.getByTestId("lr-print-preset-technical")).toBeVisible();
    await expect(toolbar.getByTestId("lr-export-floor-plan")).toBeVisible();
    await expect(toolbar.getByTestId("lr-print-layer-labels")).toBeVisible();
    await expect(toolbar.getByTestId("lr-print-layer-reference-dims")).toBeVisible();

    await toolbar.getByTestId("lr-print-preset-technical").click();
    await expect(toolbar.getByTestId("lr-print-preset-technical")).toHaveClass(/is-active/);
    await expect(toolbar.getByTestId("lr-print-layer-furniture")).not.toBeChecked();
    await expect(toolbar.getByTestId("lr-print-layer-dims")).toBeChecked();
    await expect(toolbar.getByTestId("lr-print-layer-reference-dims")).toBeChecked();
    await expect(toolbar.getByTestId("lr-print-layer-labels")).toBeChecked();

    await toolbar.getByTestId("lr-print-preset-sales").click();
    await expect(toolbar.getByTestId("lr-print-preset-sales")).toHaveClass(/is-active/);
    await expect(toolbar.getByTestId("lr-print-layer-furniture")).toBeChecked();
    await expect(toolbar.getByTestId("lr-print-layer-reference-dims")).not.toBeChecked();
    await expect(toolbar.getByTestId("lr-print-layer-labels")).toBeChecked();

    await toolbar.getByTestId("lr-print-layer-grid").check();
    await expect(toolbar.getByTestId("lr-print-layer-grid")).toBeChecked();

    await expect(toolbar.getByTestId("lr-export-floor-plan")).toBeEnabled();
    await expect(toolbar.getByTestId("lr-export-floor-plan-png")).toBeVisible();

    // Export PDF — wait for download separately so click failures are not swallowed.
    const exportBtn = toolbar.getByTestId("lr-export-floor-plan");
    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await exportBtn.click();
    let download: { suggestedFilename(): string } | null = null;
    try {
      download = await downloadPromise;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTimeout = /timeout/i.test(message) || (error instanceof Error && error.name === "TimeoutError");
      if (!isTimeout) throw error;
      // Download event unavailable in some sandboxes — assert status only (click already ran).
      const status = page.getByTestId("lr-export-floor-plan-status");
      await expect(status).toBeVisible({ timeout: 30_000 });
      const statusText = await status.textContent();
      expect(statusText ?? "").not.toMatch(/failed/i);
      expect(statusText ?? "").toMatch(/Exported floor plan PDF/i);
      return;
    }

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    const status = page.getByTestId("lr-export-floor-plan-status");
    await expect(status).toBeVisible({ timeout: 30_000 });
    const statusText = await status.textContent();
    expect(statusText ?? "").not.toMatch(/failed/i);
    expect(statusText ?? "").toMatch(/Exported floor plan PDF/i);
  });
});
