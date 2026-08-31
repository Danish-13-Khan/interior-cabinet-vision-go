import { expect, test } from "@playwright/test";

async function open3dGuide(page: import("@playwright/test").Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
  await page.getByRole("button", { name: "3D", exact: true }).click();
}

test("Phase J1 introduces client-facing 3D modes and keeps the guide reopenable", async ({ page }) => {
  await open3dGuide(page);

  const guide = page.getByRole("region", { name: "Welcome to the 3D room" });
  await expect(guide).toBeVisible();
  await expect(guide.getByRole("heading", { name: "How would you like to explore?" })).toBeVisible();
  await expect(guide.locator(".lr-onboarding-modes > button")).toHaveCount(3);
  await expect(guide.getByRole("button", { name: /Try Dollhouse/ })).toHaveAttribute("aria-pressed", "true");

  await guide.getByRole("button", { name: /Try Orbit/ }).click();
  await expect(page.getByRole("button", { name: "Orbit", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".lr-model-mode-readout")).toContainText("Circle the room");

  await guide.getByRole("button", { name: /Try Walkthrough/ }).click();
  await expect(page.locator(".lr-model-readout")).toContainText("WASD");
  await guide.getByRole("button", { name: "Start exploring" }).click();
  await expect(guide).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Dollhouse", exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "? 3D guide", exact: true }).click();
  await expect(guide).toBeVisible();
  await guide.getByRole("button", { name: "Close 3D guide" }).click();

  await page.getByRole("button", { name: "2D", exact: true }).click();
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(guide).toHaveCount(0);
});
