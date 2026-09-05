import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createShellPlan } from "./plannerStart";

/** 1×1 PNG — image path must keep working after PDF accept is added. */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");
const TWO_PAGE_PDF = readFileSync(join(FIXTURE_DIR, "two-page-plan.pdf"));

async function openImportPanel(page: import("@playwright/test").Page) {
  const importTool = page.getByRole("button", { name: "Import plan", exact: true });
  await expect(importTool).toBeVisible();
  await importTool.click();
  await expect(page.getByTestId("lr-underlay-empty").or(page.getByTestId("lr-underlay-controls"))).toBeVisible();
}

test.describe("Phase 5.1 PDF underlay", () => {
  test("image underlay import still works with PDF accept", async ({ page }) => {
    test.setTimeout(60_000);
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
    await expect(page.getByTestId("lr-plan-underlay-image")).toBeVisible();
    await expect(page.getByTestId("lr-underlay-pdf-dialog")).toHaveCount(0);
  });

  test("PDF multi-page pick imports calibratable underlay", async ({ page }) => {
    test.setTimeout(90_000);
    await createShellPlan(page);
    await page.getByTestId("fit-plan").first().click();
    await openImportPanel(page);

    const fileInput = page.locator('input[type="file"][accept*="application/pdf"]').first();
    await fileInput.setInputFiles({
      name: "two-page-plan.pdf",
      mimeType: "application/pdf",
      buffer: TWO_PAGE_PDF,
    });

    await expect(page.getByTestId("lr-underlay-pdf-dialog")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("lr-underlay-pdf-page-1")).toBeVisible();
    await expect(page.getByTestId("lr-underlay-pdf-page-2")).toBeVisible();
    await page.getByTestId("lr-underlay-pdf-page-2").click();
    await expect(page.getByTestId("lr-underlay-pdf-preview").locator("img")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId("lr-underlay-pdf-dialog-confirm").click();

    await expect(page.getByTestId("lr-underlay-controls")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("lr-underlay-calibrated-chip")).toContainText(/Not calibrated/i);
    await expect(page.getByTestId("lr-plan-underlay-image")).toBeVisible();
    await expect(page.getByTestId("lr-underlay-pdf-dialog")).toHaveCount(0);
  });
});
