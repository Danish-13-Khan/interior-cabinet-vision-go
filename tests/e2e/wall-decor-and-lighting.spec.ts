import { expect, test, type Page } from "@playwright/test";
import { clickInteriorsTool, createShellPlan } from "./plannerStart";
import { reopenViaDownloadedJson, renderQaStill, saveProjectViaDownload } from "./interiorsSaveReopen";

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";
const WALL = "lr-wall-back";

async function selectWall(page: Page) {
  await clickInteriorsTool(page, "select");
  const wall = page.locator(`line[data-wall-id="${WALL}"]`);
  await expect(wall).toHaveCount(1);
  await wall.click({ force: true });
  await expect(page.getByTestId("wall-editing-panel")).toBeVisible();
}

test("cove on a wall, panel light on the ceiling, wainscot, save, reopen, render", async ({ page }) => {
  test.setTimeout(120_000);
  await createShellPlan(page, { localStorage: { [GUIDE_KEY]: "dismissed" } });
  await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();

  await test.step("Cove on the back wall", async () => {
    await selectWall(page);
    await page.getByTestId("wall-lighting").getByRole("button", { name: "Cove", exact: true }).click();
    await expect(page.getByTestId("light-fixture-inspector")).toContainText(/Cove LED strip on .+ wall/);
  });

  await test.step("Panel light on the ceiling", async () => {
    // Select the room floor. Escape is ignored while a spinbutton or select has focus.
    await page.locator("[data-room-floor]").click({ force: true });
    const ceiling = page.getByTestId("ceiling-lighting");
    await ceiling.scrollIntoViewIfNeeded();
    await expect(ceiling).toBeVisible();
    await ceiling.getByRole("button", { name: "Panel light", exact: true }).click();
    await expect(page.getByTestId("light-fixture-inspector")).toContainText("Panel light on the ceiling");
  });

  await test.step("Wainscot on the wall", async () => {
    await selectWall(page);
    await page.getByTestId("wall-decor-wainscot").click();
    await expect(page.locator('[data-catalog-item-id="living:wainscot-panel"]')).toHaveCount(1);
  });

  await test.step("Save and reopen", async () => {
    const download = await saveProjectViaDownload(page);
    await reopenViaDownloadedJson(page, download);
    await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();
    await expect(page.locator('[data-catalog-item-id="living:wainscot-panel"]')).toHaveCount(1);
    await expect(page.locator("[data-light-id]")).toHaveCount(2);
  });

  await test.step("Render", async () => {
    await page.getByRole("button", { name: "3D", exact: true }).click();
    await renderQaStill(page);
  });
});
