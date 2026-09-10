import { expect, test, type Page } from "@playwright/test";
import { clickInteriorsTool, createShellPlan } from "./plannerStart";
import {
  reopenViaDownloadedJson,
  renderQaStill,
  saveProjectViaDownload,
} from "./interiorsSaveReopen";

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";
const OAK_ID = "lr-material-natural-oak";
const WALNUT_HEX = "#4b3328";
/** Starter has a window on left and door on front — only back/right are clear for mid-clicks. */
const HIDE_WALL = "lr-wall-right";
const PANEL_WALL = "lr-wall-back";

/** Same click path as phase-m5 (force on the SVG line — openings steal geometric midpoints). */
async function selectWall(page: Page, wallId: string) {
  await clickInteriorsTool(page, "select");
  const wall = page.locator(`line[data-wall-id="${wallId}"]`);
  await expect(wall).toHaveCount(1);
  await wall.click({ force: true });
  await expect(wall).toHaveClass(/is-active/);
  await expect(page.getByTestId("add-wall-panel")).toBeVisible();
}

test("Phase M7 exit journey: room → 3D → camera → hide → materials → panel → edit → save → reopen → render", async ({
  page,
}) => {
  test.setTimeout(process.env.CI ? 240_000 : 120_000);
  await createShellPlan(page, { localStorage: { [GUIDE_KEY]: "dismissed" } });
  await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();

  await test.step("Open 3D, change camera, and hide a wall", async () => {
    await selectWall(page, HIDE_WALL);

    await page.getByRole("button", { name: "3D", exact: true }).click();
    const viewport = page.getByTestId("lr-model-viewport");
    await expect(viewport).toBeVisible();
    await page.getByTestId("model-view-isometric").click({ force: true });
    await expect(viewport).toHaveAttribute("data-view-preset", "isometric");

    await expect(page.getByTestId("model-hide-wall")).toBeVisible();
    await page.getByTestId("model-hide-wall").click();
    await expect(page.getByTestId("model-wall-visibility")).toBeVisible();
  });

  await test.step("Apply material colour", async () => {
    await clickInteriorsTool(page, "material");
    await expect(page.getByText("Material Browser", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Floor", exact: true }).click();
    await page.locator(`[aria-label="Material browser"] [data-material-id="${OAK_ID}"]`).first().click();
    await page.getByTestId("material-shade-wood-walnut").click();
    await expect(page.getByTestId("material-recent-4b3328")).toBeVisible();
  });

  await test.step("Add a feature wall panel", async () => {
    await page.getByRole("button", { name: "2D", exact: true }).click();
    await expect(page.locator("[data-room-floor]").first()).toHaveAttribute("fill", WALNUT_HEX);
    await selectWall(page, PANEL_WALL);
    await page.getByTestId("add-wall-panel").click();
    await expect(page.locator('[data-catalog-item-id="living:decorative-panel"]')).toHaveCount(1);
  });

  await test.step("Place cabinet and edit width", async () => {
    await clickInteriorsTool(page, "cabinet");
    await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
    await expect(page.locator("[data-object-id].is-selected").first()).toBeVisible();
    const width = page.getByRole("spinbutton", { name: "W mm" });
    await expect(width).toBeVisible();
    await width.fill("1000");
    await width.blur();
    await expect(page.locator('[data-width-mm="1000"]').first()).toBeVisible();
  });

  await test.step("Save and cold-reopen downloaded JSON", async () => {
    const download = await saveProjectViaDownload(page);
    expect(download.suggestedFilename()).toMatch(/\.json$/i);
    await reopenViaDownloadedJson(page, download);
    await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();
    await expect(page.locator('[data-catalog-item-id="living:decorative-panel"]')).toHaveCount(1);
    await expect(page.locator('[data-width-mm="1000"]').first()).toBeVisible();
    await expect(page.locator("[data-room-floor]").first()).toHaveAttribute("fill", WALNUT_HEX);
    await clickInteriorsTool(page, "material");
    await page.getByRole("tab", { name: "Floor", exact: true }).click();
    await expect(page.getByTestId("material-recent-4b3328")).toBeVisible();
  });

  await test.step("Render still", async () => {
    await page.getByRole("button", { name: "3D", exact: true }).click();
    await expect(page.getByTestId("model-wall-visibility")).toBeVisible();
    await renderQaStill(page);
  });
});
