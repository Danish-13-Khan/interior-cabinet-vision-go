import { expect, test } from "@playwright/test";
import { openGoldenCabinetRun } from "./golden-cabinet-run.helpers";

test.describe("Phase 3 cabinet plan excellence", () => {
  test("Complete Run, remaining readout, and plan marks on golden run", async ({ page }) => {
    test.setTimeout(90_000);
    await openGoldenCabinetRun(page);

    await page.getByTestId("interiors-tool-cabinet").click();
    await expect(page.getByTestId("interiors-cabinet-run-tray")).toBeVisible();

    // Select a golden-run cabinet so the Interiors run chrome sees selectedRunId.
    const runCabinet = page.locator(".lr-plan-svg [data-object-id][data-cabinet-type=base]").first();
    await expect(runCabinet).toBeVisible();
    await runCabinet.click();

    await expect(page.getByTestId("interiors-cabinet-run-tray").getByTestId("lr-complete-run")).toBeVisible();
    await expect(page.getByTestId("interiors-cabinet-run-tray").getByTestId("lr-remaining-wall")).toContainText(/Remaining on wall:/);

    const marks = page.getByTestId("interiors-cabinet-run-tray").getByTestId("lr-plan-marks-toggle");
    await expect(marks).toBeVisible();
    await marks.check();
    await expect(marks).toBeChecked();
    await expect(page.locator(".lr-plan-mark").first()).toBeVisible({ timeout: 10_000 });

    await page.getByTestId("interiors-cabinet-run-tray").getByTestId("lr-complete-run").click();
    await expect(page.getByTestId("lr-complete-run-summary").first()).toBeVisible();
  });
});
