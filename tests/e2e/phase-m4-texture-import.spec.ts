import { expect, test } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

test("Phase M4 previews texture, applies UV, and rejects unsupported types", async ({ page }) => {
  test.setTimeout(60_000);
  await createShellPlan(page);
  await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();

  await page.keyboard.press("b");
  await expect(page.getByText("Material Browser", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Floor", exact: true }).click();

  const png = Buffer.from(TINY_PNG_BASE64, "base64");
  await page.getByTestId("finish-import-input").setInputFiles({
    name: "sample-finish.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByTestId("finish-import-preview")).toBeVisible();
  const layer = page.getByTestId("finish-import-preview-layer");
  await expect(layer).toBeVisible();
  const before = await layer.evaluate((node) => (node as HTMLElement).style.transform);
  await page.getByLabel("Tile mm mm").fill("750");
  await page.getByLabel("Rotate ° deg").fill("90");
  await expect.poll(async () =>
    layer.evaluate((node) => (node as HTMLElement).style.transform),
  ).not.toBe(before);
  await page.getByTestId("finish-import-apply").click();
  await expect(page.getByTestId("finish-import-preview")).toHaveCount(0);
  await expect(page.locator('[aria-label="Material browser"] [data-material-id="finish-import-1"]')).toBeVisible();

  await page.getByTestId("finish-import-input").setInputFiles({
    name: "bad.gif",
    mimeType: "image/gif",
    buffer: Buffer.from("GIF89a"),
  });
  await expect(page.getByTestId("finish-import-error")).toContainText(/Unsupported file type/);
});
