import { expect, test, type Page } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

/** 1×1 PNG */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function importPng(page: Page) {
  await createShellPlan(page);
  await page.getByTestId("fit-plan").first().click();
  await page.getByRole("button", { name: "Import plan", exact: true }).click();
  await page.locator('input[type="file"][accept*="image/png"]').first().setInputFiles({
    name: "sideways-plan.png",
    mimeType: "image/png",
    buffer: TINY_PNG,
  });
  await expect(page.getByTestId("lr-underlay-controls")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("lr-plan-underlay-image")).toBeVisible();
}

const undo = (page: Page) => page.getByRole("button", { name: "Undo", exact: true }).click();
const panX = (page: Page) => page.getByLabel("Underlay pan X");
const rotation = (page: Page) => page.getByLabel("Underlay rotation");

test.describe("Underlay gestures (Phase 1)", () => {
  test("quarter turns are one click and one undo step", async ({ page }) => {
    await importPng(page);
    await page.getByTestId("lr-underlay-rotate-right").click();
    await expect(rotation(page)).toHaveValue("90");
    await page.getByTestId("lr-underlay-rotate-right").click();
    await page.getByTestId("lr-underlay-rotate-right").click();
    await expect(rotation(page)).toHaveValue("-90");
    await page.getByTestId("lr-underlay-rotate-left").click();
    await expect(rotation(page)).toHaveValue("180");
    await undo(page);
    await expect(rotation(page)).toHaveValue("-90");
  });

  test("Move underlay drags the image and commits once on release", async ({ page }) => {
    await importPng(page);
    await page.getByTestId("lr-underlay-move-toggle").click();
    await expect(page.getByTestId("lr-underlay-move-toggle")).toHaveAttribute("aria-pressed", "true");
    const image = page.getByTestId("lr-plan-underlay-image");
    await expect(image).toHaveClass(/is-movable/);
    const box = (await image.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy + 30, { steps: 6 });
    await page.mouse.move(cx + 120, cy + 60, { steps: 6 });
    await page.mouse.up();
    await expect(panX(page)).not.toHaveValue("0");
    await undo(page);
    await expect(panX(page)).toHaveValue("0");
  });

  test("Centre on origin resets pan and keeps rotation", async ({ page }) => {
    await importPng(page);
    await panX(page).fill("500");
    await page.getByTestId("lr-underlay-rotate-right").click();
    await page.getByTestId("lr-underlay-centre").click();
    await expect(panX(page)).toHaveValue("0");
    await expect(rotation(page)).toHaveValue("90");
  });

  test("a locked underlay cannot be rotated or moved, and Done moving still exits", async ({ page }) => {
    await importPng(page);
    const toggle = page.getByTestId("lr-underlay-move-toggle");
    await toggle.click();
    await page.getByTestId("lr-underlay-lock-toggle").click();
    await expect(page.getByTestId("lr-underlay-lock-hint")).toBeVisible();
    await expect(page.getByTestId("lr-underlay-rotate-left")).toBeDisabled();
    await expect(page.getByTestId("lr-underlay-rotate-right")).toBeDisabled();
    await expect(page.getByTestId("lr-underlay-centre")).toBeDisabled();
    await expect(page.getByTestId("lr-plan-underlay-image")).not.toHaveClass(/is-movable/);
    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveText("Done moving");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toBeDisabled();
  });
});
