import { expect, test, type Page } from "@playwright/test";
import { loadReleaseDemo, openQaRenderStudio } from "./plannerStart";

type CapturedDownload = {
  name: string;
  text?: string;
};

async function openRenderStudio(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors" }).click();
  await loadReleaseDemo(page);
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Living Room Release Demo");
  await openQaRenderStudio(page);
  await expect(page.getByTestId("lr-render-live")).toBeVisible();
  await expect(page.locator(".lr-render-actions").getByRole("button", { name: "Generate Still" }))
    .toBeEnabled({ timeout: 60_000 });
}

async function acceptHybridStill(page: Page) {
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

async function captureClientPackageDownloads(page: Page) {
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

test("K1 hybrid stills: generate, review, accept under trust contract", async ({ page }) => {
  test.setTimeout(180_000);
  await openRenderStudio(page);

  const generateStill = page.getByRole("button", { name: "Generate Still" });
  await expect(generateStill).toBeEnabled({ timeout: 60_000 });
  await expect(page.locator(".lr-plan-canvas canvas").first()).toBeVisible({ timeout: 30_000 });
  await generateStill.click();
  await expect(page.getByTestId("still-review-panel")).toBeVisible({ timeout: 90_000 });

  const review = page.getByTestId("still-review-panel");
  await expect(review).toContainText("Still review");
  await expect(review).toContainText("Hybrid Still");
  await expect(review).toContainText("faithful enhance", { ignoreCase: true });

  const trust = page.getByTestId("still-trust-panel");
  await expect(trust).toContainText("TRUST OK", { timeout: 20_000 });
  await expect(trust).toContainText("stilljob-hero");

  await expect(review.locator("img[alt='WebGL plate']")).toBeVisible();
  await expect(review.locator("img[alt='Hero still']")).toBeVisible();
  await expect(review.locator("img[alt='Diff']")).toBeVisible();

  const accept = review.getByRole("button", { name: "Accept" });
  await expect(accept).toBeEnabled();
  await accept.click();

  await expect(page.getByText(/Still accepted · will record provenance/i)).toBeVisible();
  await expect(review).toContainText("accepted");
  await expect(review).toContainText("1 accepted for package");
});

test("K1 hybrid stills: client package exports accepted still manifest and PNG", async ({ page }) => {
  test.setTimeout(180_000);
  await openRenderStudio(page);
  await acceptHybridStill(page);

  const downloads = await captureClientPackageDownloads(page);
  const provenanceFile = downloads.find((item) => item.name.includes("stills-provenance"));
  expect(provenanceFile?.text).toBeTruthy();
  const provenance = JSON.parse(provenanceFile!.text!) as Array<Record<string, unknown>>;
  expect(provenance).toHaveLength(1);
  expect(provenance[0]?.acceptanceStatus).toBe("accepted");
  expect(provenance[0]?.engine).toEqual({ id: "stilljob-hero", version: "1.0.0" });

  const manifestFile = downloads.find((item) => item.name.endsWith("-manifest.json"));
  expect(manifestFile?.text).toBeTruthy();
  const manifest = JSON.parse(manifestFile!.text!) as { acceptedStills: Array<Record<string, unknown>> };
  expect(manifest.acceptedStills).toHaveLength(1);
  expect(manifest.acceptedStills[0]?.jobId).toBe(provenance[0]?.jobId);
  expect(manifest.files.some((name: string) => name.endsWith("-millwork-schedule.pdf"))).toBe(true);
  expect(manifest.files.some((name: string) => name.endsWith("-millwork-schedule.csv"))).toBe(true);
  expect((manifest as { workshopSchedule?: { lineCount: number } }).workshopSchedule?.lineCount).toBeGreaterThan(0);

  expect(downloads.some((item) => item.name.endsWith("-still.png"))).toBe(true);
  expect(downloads.some((item) => item.name.endsWith("-millwork-schedule.pdf"))).toBe(true);
});

test("K1 hybrid stills: reject leaves project editable", async ({ page }) => {
  test.setTimeout(240_000);
  await openRenderStudio(page);

  const generateStill = page.locator(".lr-render-actions").getByRole("button", { name: "Generate Still" });
  await expect(page.locator(".lr-plan-canvas canvas").first()).toBeVisible({ timeout: 30_000 });
  await generateStill.click();

  const review = page.getByTestId("still-review-panel");
  await expect(review).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId("still-review-status")).toHaveText("pending review", { timeout: 30_000 });
  await expect(page.getByTestId("still-trust-panel")).toContainText("TRUST OK", { timeout: 20_000 });

  const reject = review.getByRole("button", { name: "Reject" });
  await expect(reject).toBeEnabled();
  // Avoid actionability hangs when the review stage is still settling after generation.
  await reject.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByTestId("still-review-status")).toHaveText("rejected", { timeout: 15_000 });

  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.getByRole("button", { name: "2D", exact: true })).toHaveClass(/is-active/);
  await expect(page.locator(".lr-plan-svg .lr-plan-object").first()).toBeVisible({ timeout: 15_000 });
});
