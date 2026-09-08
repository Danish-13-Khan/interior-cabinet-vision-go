import { expect, type Download, type Page } from "@playwright/test";
import { openQaRenderStudio } from "./plannerStart";

/** Save the open interiors project (JSON download). */
export async function saveProjectViaDownload(page: Page): Promise<Download> {
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("interiors-save-state").click();
  const download = await downloadPromise;
  await expect(page.getByTestId("interiors-save-state")).toBeVisible();
  return download;
}

/**
 * Cold reopen: persist the download to disk, reload the app, open that exact JSON.
 * Avoids passing via in-memory recent-project state alone.
 */
export async function reopenViaDownloadedJson(page: Page, download: Download): Promise<string> {
  const filename = download.suggestedFilename() || "m7-project.json";
  const target = `${process.cwd()}/test-results/m7-${filename}`;
  await download.saveAs(target);

  await page.goto("/app");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  const home = page.getByRole("dialog", { name: "Start a living room project" });
  await expect(home).toBeVisible();

  const chooserPromise = page.waitForEvent("filechooser");
  await home.getByRole("button", { name: "Open project", exact: true }).click();
  await (await chooserPromise).setFiles(target);
  await expect(home).toBeHidden({ timeout: 15_000 });
  return target;
}

/** QA Render Studio still capture (same path as release / render smoke). */
export async function renderQaStill(page: Page) {
  await openQaRenderStudio(page);
  const renderButton = page.getByRole("button", { name: "Render Image" });
  await expect(renderButton).toBeEnabled({ timeout: 25_000 });
  await renderButton.click();
  await expect(page.getByAltText(/Render from/)).toBeVisible({ timeout: 30_000 });
}
