import { expect, test as base, type Page } from "@playwright/test";
import { loadReleaseDemo, openQaRenderStudio, openInteriorsHome } from "./plannerStart";

/**
 * After a test renders and accepts a hybrid still, the next page opened in the
 * same headless browser never paints: every module downloads, nothing stays
 * pending, no frame is produced and even page.reload() hangs. Each K1 spec file
 * sets a different value for this worker-scoped option at top level, which makes
 * Playwright start a fresh browser for that file instead of sharing a wedged one.
 */
export const test = base.extend<Record<never, never>, { freshBrowserSlot: number }>({
  freshBrowserSlot: [0, { scope: "worker", option: true }],
});
export { expect };

export type CapturedDownload = {
  name: string;
  text?: string;
};

export async function openRenderStudio(page: Page) {
  await openInteriorsHome(page);
  await loadReleaseDemo(page);
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Living Room Release Demo");
  await openQaRenderStudio(page);
  await expect(page.getByTestId("lr-render-live")).toBeVisible();
  await expect(page.locator(".lr-render-actions").getByRole("button", { name: "Generate Still" }))
    .toBeEnabled({ timeout: 60_000 });
}

export async function acceptHybridStill(page: Page) {
  const generateStill = page.locator(".lr-render-actions").getByRole("button", { name: "Generate Still" });
  await expect(generateStill).toBeEnabled({ timeout: 60_000 });
  await expect(page.locator(".lr-plan-canvas canvas").first()).toBeVisible({ timeout: 30_000 });
  await generateStill.click();
  await expect(page.getByTestId("still-review-panel")).toBeVisible({ timeout: 90_000 });
  const review = page.getByTestId("still-review-panel");
  await expect(page.getByTestId("still-trust-panel")).toContainText("TRUST OK", { timeout: 20_000 });
  await review.getByRole("button", { name: "Accept" }).click();
  await expect(review).toContainText("1 accepted for package");
}

export async function captureClientPackageDownloads(page: Page) {
  const captured: CapturedDownload[] = [];
  page.on("download", async (download) => {
    const name = download.suggestedFilename();
    let text: string | undefined;
    if (name.endsWith(".json")) {
      const stream = await download.createReadStream();
      if (stream) {
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
          stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on("end", () => resolve());
          stream.on("error", reject);
        });
        text = Buffer.concat(chunks).toString("utf8");
      }
    }
    captured.push({ name, text });
  });
  await page.locator(".lr-render-actions").getByRole("button", { name: "Download client pack", exact: true }).click();
  await expect.poll(
    () => captured.some((item) => item.name.includes("stills-provenance")),
    { timeout: 20_000 },
  ).toBe(true);
  await expect.poll(
    () => captured.some((item) => item.name.endsWith("-still.png")),
    { timeout: 20_000 },
  ).toBe(true);
  // Schedule PDF is written after still assets; wait for full package export.
  await expect.poll(
    () => captured.some((item) => item.name.endsWith("-millwork-schedule.pdf")),
    { timeout: 20_000 },
  ).toBe(true);
  // Shared controller mirrors status in Review + Render Studio — scope to studio.
  await expect(
    page.getByTestId("lr-plan-canvas").getByText(/Client package exported.*accepted stills/i),
  ).toBeVisible({ timeout: 20_000 });
  return captured;
}
