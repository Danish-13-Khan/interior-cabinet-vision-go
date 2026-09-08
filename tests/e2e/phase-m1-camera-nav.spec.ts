import { expect, test } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";

test("Phase M1 exposes primary cameras, isometric framing, Fit, Focus, and focus-gated shortcuts", async ({ page }) => {
  test.setTimeout(60_000);
  await createShellPlan(page, { localStorage: { [GUIDE_KEY]: "dismissed" } });

  await page.getByTestId("interiors-tool-cabinet").click();
  await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
  const selectedPlanObject = page.locator("[data-object-id].is-selected").first();
  expect(await selectedPlanObject.getAttribute("data-object-id")).toBeTruthy();

  await page.getByRole("button", { name: "3D", exact: true }).click();
  const viewport = page.getByTestId("lr-model-viewport");
  const canvasHost = page.getByTestId("lr-model-canvas-host");
  await expect(viewport).toBeVisible();
  await expect(page.getByTestId("model-camera-presets")).toBeVisible();

  // Focus Selected while the placed cabinet is still selected from 2D.
  await expect(page.getByTestId("model-focus-selection")).toBeEnabled();
  await page.getByTestId("model-focus-selection").click({ force: true });
  await expect(page.locator(".lr-inspector").getByText("Selected Object", { exact: true })).toBeVisible();

  // Clear selection so pickable object labels cannot cover the camera toolbar.
  await page.getByTestId("model-clear-selection").click({ force: true });
  await expect(page.getByTestId("model-clear-selection")).toHaveCount(0);
  await expect(page.getByTestId("model-focus-selection")).toBeDisabled();

  await expect(page.getByTestId("model-view-perspective")).toBeVisible();
  await expect(page.getByTestId("model-view-isometric")).toBeVisible();
  await expect(page.getByTestId("model-view-front")).toBeVisible();
  await expect(page.getByTestId("model-view-side")).toBeVisible();
  await expect(page.getByTestId("model-view-top")).toBeVisible();
  await expect(page.getByTestId("model-view-dollhouse")).toBeVisible();

  await page.getByTestId("model-view-isometric").click();
  await expect(viewport).toHaveAttribute("data-view-preset", "isometric");
  await expect(page.getByTestId("model-view-isometric")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("model-view-dollhouse")).toHaveAttribute("aria-pressed", "false");

  await page.getByTestId("model-view-front").click();
  await expect(viewport).toHaveAttribute("data-view-preset", "front");

  // Toolbar focus must not enable canvas shortcuts (stay on Front, not Isometric).
  await page.getByTestId("model-fit-room").focus();
  await page.keyboard.press("4");
  await expect(viewport).toHaveAttribute("data-view-preset", "front");

  await canvasHost.focus();
  await page.keyboard.press("4");
  await expect(viewport).toHaveAttribute("data-view-preset", "isometric");
  await page.keyboard.press("5");
  await expect(viewport).toHaveAttribute("data-view-preset", "perspective");

  await page.getByTestId("model-fit-room").click();
  await page.getByTestId("model-view-perspective").click();
  await expect(viewport).toHaveAttribute("data-view-preset", "perspective");

  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.getByRole("button", { name: "2D", exact: true })).toHaveClass(/is-active/);
  await page.keyboard.press("2");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  await expect(page.getByRole("button", { name: "3D", exact: true })).toHaveClass(/is-active/);
});
