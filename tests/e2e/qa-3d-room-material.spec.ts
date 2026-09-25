import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { clickInteriorsTool, createBlankPlan, drawRectangleRoom } from "./plannerStart";

const SHOT_DIR = join("artifacts", "qa-3d");

async function enterModel(page: Page) {
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  const guide = page.getByRole("button", { name: "Close 3D guide" });
  if (await guide.isVisible().catch(() => false)) await guide.click();
}

async function expectRoomFramed(page: Page, preset: string) {
  const model = page.getByTestId("lr-model-viewport");
  const canvas = page.locator(".lr-model-viewport canvas");
  await expect.poll(async () => canvas.getAttribute("data-frame-settled")).toBe("1");
  await expect.poll(async () => canvas.getAttribute("data-camera-outside")).toBe("1");
  if (preset !== "walkthrough") await expect(model).toHaveAttribute("data-ceiling-hidden", "1");
  if (preset === "perspective" || preset === "front" || preset === "side") {
    await expect(model).toHaveAttribute("data-near-wall-cut", "1");
  }
  if (preset === "walkthrough") return;
  await expect.poll(async () => Number(await canvas.getAttribute("data-frame-span"))).toBeGreaterThanOrEqual(0.55);
  const minArea = preset === "front" || preset === "side" || preset === "top" ? 0.18 : 0.28;
  await expect.poll(async () => Number(await canvas.getAttribute("data-frame-coverage"))).toBeGreaterThanOrEqual(minArea);
}

async function expectMaterialStacked(page: Page) {
  const stacked = await page.evaluate(() => {
    const read = (selector: string) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    };
    const swatches = read(".lr-paint-swatches");
    const catalogue = read(".lr-manufacturer-catalogue");
    const colour = read(".lr-material-colour");
    if (!swatches || !catalogue || !colour) return false;
    const overlaps = (a: typeof swatches, b: typeof swatches) =>
      a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
    return !overlaps(swatches, catalogue) && !overlaps(swatches, colour) && catalogue.top >= swatches.bottom - 1;
  });
  expect(stacked).toBe(true);
}

test.beforeAll(() => {
  mkdirSync(join(SHOT_DIR, "cameras"), { recursive: true });
});

test("closed room extrudes in 3D and a floor swatch updates the current finish", async ({ page }) => {
  test.setTimeout(90_000);
  await createBlankPlan(page);
  await drawRectangleRoom(page);
  await expect(page.locator("[data-wall-id]")).toHaveCount(4);
  await enterModel(page);
  const model = page.getByTestId("lr-model-viewport");
  await expect(page.getByTestId("plan-trace-empty")).toHaveCount(0);
  await expect.poll(async () => Number(await model.getAttribute("data-extruded-walls"))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await model.getAttribute("data-scene-height-mm"))).toBeGreaterThan(400);

  const presets = ["perspective", "isometric", "front", "side", "top", "dollhouse", "orbit", "walkthrough"] as const;
  for (const preset of presets) {
    await page.getByTestId(`model-view-${preset}`).click();
    await page.waitForTimeout(600);
    await expectRoomFramed(page, preset);
    await page.screenshot({ path: join(SHOT_DIR, "cameras", `${preset}.png`) });
    if (preset === "perspective") await page.screenshot({ path: join(SHOT_DIR, "drawn-room-perspective.png") });
    if (preset === "top") await page.screenshot({ path: join(SHOT_DIR, "drawn-room-top.png") });
  }
  await page.getByTestId("model-view-dollhouse").click();
  await page.getByTestId("model-fit-room").click();
  await page.waitForTimeout(600);
  await expectRoomFramed(page, "dollhouse");
  await page.screenshot({ path: join(SHOT_DIR, "cameras", "fit-room.png") });
  await page.screenshot({ path: join(SHOT_DIR, "drawn-room-dollhouse-fit.png") });
  await page.getByRole("button", { name: "2D plan", exact: true }).click();
  await clickInteriorsTool(page, "material");
  await expect(page.getByText("Material Browser", { exact: true })).toBeVisible();
  const summary = page.getByTestId("paint-apply-summary");
  const oak = page.locator('[aria-label="Material browser"] [data-material-id="lr-material-natural-oak"]').first();
  const walnut = page.locator('[aria-label="Material browser"] [data-material-id="lr-material-walnut"]').first();
  const target = (await oak.getAttribute("class"))?.includes("is-active") ? walnut : oak;
  const expected = target === walnut ? "Smoked Walnut" : "Natural Oak";
  await target.click();
  await expect(target).toHaveClass(/is-active/);
  await expect(summary).toContainText(expected);
  await expectMaterialStacked(page);
  await page.screenshot({ path: join(SHOT_DIR, "material-1440.png") });
  await page.setViewportSize({ width: 1024, height: 640 });
  await expect(target).toBeVisible();
  await expectMaterialStacked(page);
  await page.screenshot({ path: join(SHOT_DIR, "material-1024.png") });
});

test("an open outline stays a 2D plan in 3D", async ({ page }) => {
  test.setTimeout(60_000);
  await createBlankPlan(page);
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("plan-trace-empty")).toBeVisible();
  await expect(page.getByTestId("plan-trace-empty")).toContainText("This room is still a 2D plan");
  await expect(page.getByTestId("plan-trace-raise")).toBeDisabled();
  await page.screenshot({ path: join(SHOT_DIR, "open-room-empty-state.png") });
});

test("a saved perspective camera changes the settled viewport", async ({ page }) => {
  test.setTimeout(90_000);
  await createBlankPlan(page);
  await drawRectangleRoom(page);
  await enterModel(page);
  const canvas = page.locator(".lr-model-viewport canvas");
  await page.getByTestId("model-view-perspective").click();
  await expect.poll(async () => canvas.getAttribute("data-frame-settled")).toBe("1");
  const before = await canvas.getAttribute("data-camera-x");
  await page.getByTestId("model-view-settings").getByRole("button").click();
  await page.getByTestId("model-view-settings").locator("label", { hasText: "Camera" }).locator("select").selectOption({ label: "TV Wall" });
  await expect.poll(async () => canvas.getAttribute("data-frame-settled")).toBe("1");
  await expect.poll(async () => canvas.getAttribute("data-camera-x")).not.toBe(before);
  await page.screenshot({ path: join(SHOT_DIR, "cameras", "saved-camera.png") });
});
