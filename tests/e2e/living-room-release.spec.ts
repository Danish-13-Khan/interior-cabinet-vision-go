import { expect, test } from "@playwright/test";

test("verified demo completes Plan to Model to Render and reopens", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");

  await page.getByRole("button", { name: "Interiors" }).click();
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeVisible();
  await page.getByRole("button", { name: /OPEN RELEASE DEMO/ }).click();
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Living Room Release Demo");
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("PLAN · LIVING ROOM");

  await page.keyboard.press("2");
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("MODEL");
  await page.keyboard.press("3");
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("RENDER · LIVING ROOM");

  await page.getByRole("button", { name: /Draft Fast camera/ }).click();
  await page.getByLabel("Resolution").selectOption("hd");
  const renderButton = page.getByRole("button", { name: "Render Image" });
  // The WebGL capture bridge is enabled after the presentation scene settles.
  await expect(renderButton).toBeEnabled({ timeout: 25_000 });
  await renderButton.click();
  await expect(page.getByAltText(/Render from/)).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: "test-results/release-hero.png", fullPage: false });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save *" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("living-room-release-demo.json");
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();

  await page.getByRole("button", { name: "Home" }).click();
  const recent = page.locator(".lr-recent-open").filter({
    hasText: "Living Room Release Demo",
  });
  await expect(recent.locator("img")).toBeVisible();
  await recent.click();
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeHidden();
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Living Room Release Demo");
});
