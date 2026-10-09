import { expect, test, type Page } from "@playwright/test";
import { waitForRecoveryAutosave } from "./phase-7-hardening.helpers";
import { createBlankPlanForReopen, drawRectangleRoom } from "./plannerStart";

async function enterModel(page: Page) {
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  const guide = page.getByRole("button", { name: "Close 3D guide" });
  if (await guide.isVisible().catch(() => false)) await guide.click();
}

/**
 * COB roadmap Phase 4: a COB downlight gets a Shade section; choosing Gimbal
 * exposes Aim and Aim rotation; the shade, trim and aim survive a reopen; the
 * 3D view still renders the fixture with the shade applied.
 */
test("Phase 4: COB shades, trim and gimbal aim edit in the inspector and persist", async ({ page }) => {
  test.setTimeout(120_000);
  await createBlankPlanForReopen(page);
  await drawRectangleRoom(page);
  await expect(page.locator("[data-wall-id]")).toHaveCount(4);

  await page.getByRole("button", { name: "COB downlight", exact: true }).click();
  const inspector = page.getByTestId("light-fixture-inspector");
  await expect(inspector).toBeVisible();
  const shade = inspector.getByLabel(/^Shade for /);
  await expect(shade).toHaveValue("open");
  await expect(inspector.getByLabel("Aim (°)")).toHaveCount(0);

  await shade.selectOption("gimbal");
  await expect(inspector.getByLabel("Aim (°)")).toBeVisible();
  await inspector.getByLabel("Aim (°)").fill("25");
  await inspector.getByLabel("Aim rotation (°)").fill("90");
  await inspector.getByLabel(/^Trim for /).selectOption("brass");
  await inspector.getByLabel("Lens diffusion (0–1)").fill("0.2");
  await expect(inspector.getByLabel("Aim (°)")).toHaveValue("25");

  await shade.selectOption("surface");
  await expect(inspector.getByLabel("Aim (°)")).toHaveCount(0);
  await shade.selectOption("gimbal");

  await enterModel(page);
  await expect(page.locator('[data-model-select="light"].is-selected')).toHaveCount(1);
  await page.getByRole("button", { name: "2D plan", exact: true }).click();

  await waitForRecoveryAutosave(page);
  await page.reload();
  await expect(page.getByTestId("interiors-projects-home")).toHaveCount(0);
  await page.locator("[data-light-id]").first().click();
  const reopened = page.getByTestId("light-fixture-inspector");
  await expect(reopened.getByLabel(/^Shade for /)).toHaveValue("gimbal");
  await expect(reopened.getByLabel(/^Trim for /)).toHaveValue("brass");
  await expect(reopened.getByLabel("Aim (°)")).toHaveValue("25");
  await expect(reopened.getByLabel("Aim rotation (°)")).toHaveValue("90");
  await expect(reopened.getByLabel("Lens diffusion (0–1)")).toHaveValue("0.2");
});
