import { expect, test } from "@playwright/test";
import { openInteriorsHome } from "./plannerStart";

async function openStarterRoom(page: import("@playwright/test").Page) {
  await openInteriorsHome(page);
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
}

async function enterModelView(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await expect(page.getByRole("button", { name: "Dollhouse", exact: true })).toHaveClass(/is-active/);
  await expect(page.locator(".lr-plan-status")).toContainText("Dollhouse ready");
}

test("Phase F dollhouse defaults, camera panel scoping, and walkthrough hints", async ({ page }) => {
  await openStarterRoom(page);
  await enterModelView(page);

  const dollhouse = page.getByRole("button", { name: "Dollhouse", exact: true });
  await expect(dollhouse).toHaveClass(/is-active/);
  await expect(page.getByLabel("Dollhouse camera controls")).toBeVisible();
  await expect(page.getByLabel("Camera height", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Camera field of view", { exact: true })).toBeVisible();
  await expect(page.locator(".lr-model-readout")).toContainText("Drag orbit");

  await page.getByRole("button", { name: "Perspective", exact: true }).click();
  await expect(page.getByLabel("Dollhouse camera controls")).toHaveCount(0);
  await expect(page.locator(".lr-model-readout")).toContainText("Drag orbit");

  await page.getByRole("button", { name: "Walkthrough", exact: true }).click();
  await expect(page.getByLabel("Dollhouse camera controls")).toHaveCount(0);
  await expect(page.locator(".lr-model-readout")).toContainText("WASD");

  await page.getByRole("button", { name: "Dollhouse", exact: true }).click();
  await expect(page.getByLabel("Dollhouse camera controls")).toBeVisible();
});

test("Phase F keeps Render mode separate from dollhouse review", async ({ page }) => {
  await openStarterRoom(page);
  await enterModelView(page);
  await expect(page.locator(".lr-model-viewport canvas")).toBeVisible();

  await page.getByTestId("interiors-present").click();
  await expect(page.getByTestId("interiors-present-titlebar")).toContainText("Present and Send");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
});
