import { expect, test } from "@playwright/test";
import { loadReleaseDemo } from "./plannerStart";

test("verified demo completes Plan to Model to Render and reopens", async ({ page }) => {
  // Software WebGL capture is substantially slower on GitHub-hosted runners.
  test.setTimeout(process.env.CI ? 240_000 : 90_000);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");

  await page.getByRole("button", { name: "Interiors" }).click();
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeVisible();
  await loadReleaseDemo(page);
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Living Room Release Demo");
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("2D plan");

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await page.getByTestId("interiors-present").click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Render studio");

  await page.getByRole("button", { name: /Draft Fast camera/ }).click();
  await page.getByLabel("Resolution").selectOption("hd");
  const renderButton = page.getByRole("button", { name: "Render Image" });
  // The WebGL capture bridge is enabled after the presentation scene settles.
  await expect(renderButton).toBeEnabled({ timeout: 25_000 });
  await renderButton.click();
  await expect(page.getByAltText(/Render from/)).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: "test-results/release-hero.png", fullPage: false });

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("interiors-save-state").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("living-room-release-demo.json");
  await expect(page.getByTestId("interiors-save-state")).toBeVisible();

  // Shared chrome opens project home from the project crumb.
  const startProject = page.getByTestId("interiors-project-crumb");
  await expect(startProject).toBeEnabled();
  await startProject.evaluate((button: HTMLButtonElement) => button.click());
  const recent = page.getByTestId("open-recent-project").filter({
    hasText: "Living Room Release Demo",
  });
  await expect(recent.locator("img")).toBeVisible();
  await recent.evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeHidden();
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Living Room Release Demo");
});
