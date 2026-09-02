import { expect, test, type Page } from "@playwright/test";
import { loadReleaseDemo } from "./plannerStart";

async function openRenderStudio(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors" }).click();
  await loadReleaseDemo(page);
  await page.getByTestId("interiors-present").click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Render studio");
}

test("K2 camera bookmarks: rename deck view and export package views", async ({ page }) => {
  test.setTimeout(120_000);
  await openRenderStudio(page);

  const deck = page.getByLabel("Package camera deck");
  await expect(deck).toBeVisible();
  await expect(deck).toContainText(/Package deck/i);
  await expect(deck.locator("ol li")).not.toHaveCount(0);

  const renameInput = deck.getByRole("textbox", { name: /Package view name for/i }).first();
  await renameInput.fill("Client Hero Wide");
  await renameInput.blur();
  await expect(renameInput).toHaveValue("Client Hero Wide");

  const captured: { name: string; text?: string }[] = [];
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

  await page.locator(".lr-render-actions").getByRole("button", { name: "Client Package", exact: true }).click();
  await expect.poll(
    () => captured.some((item) => item.name.includes("package-views")),
    { timeout: 20_000 },
  ).toBe(true);

  const viewsFile = captured.find((item) => item.name.includes("package-views"));
  expect(viewsFile?.text).toContain("Client Hero Wide");
});

test("K2 camera bookmarks: toggle camera out of package deck", async ({ page }) => {
  test.setTimeout(90_000);
  await openRenderStudio(page);

  const deck = page.getByLabel("Package camera deck");
  const removeButtons = deck.getByRole("button", { name: "Remove from package deck" });
  const before = await removeButtons.count();
  expect(before).toBeGreaterThan(0);
  await removeButtons.first().click();
  await expect(deck.getByRole("button", { name: "Remove from package deck" })).toHaveCount(before - 1);
});
