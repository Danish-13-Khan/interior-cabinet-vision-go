import { expect, test, type Page } from "@playwright/test";
import { createShellPlan, pointOnPaper } from "./plannerStart";
import { reopenViaDownloadedJson, saveProjectViaDownload } from "./interiorsSaveReopen";

/** 1×1 PNG */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const paper = (page: Page) => page.getByRole("application", { name: "Living room plan editor" });
const guides = (page: Page) => page.locator("g.lr-plan-guide");

async function placeGuide(page: Page, tool: "place-guide-x" | "place-guide-z", x: number, y: number) {
  await page.locator(`[data-build-tool="${tool}"]`).first().click();
  const point = await pointOnPaper(paper(page), x, y);
  await page.mouse.click(point.x, point.y);
}

async function importPng(page: Page, name: string) {
  await page.getByRole("button", { name: "Import plan", exact: true }).click();
  await page.locator('input[type="file"][accept*="image/png"]').first().setInputFiles({
    name, mimeType: "image/png", buffer: TINY_PNG,
  });
  await expect(page.getByTestId("lr-plan-underlay-image")).toBeVisible({ timeout: 15_000 });
}

test.describe("Plan guides and centre axis (Phase 3)", () => {
  test("place, label, delete; auto centre line hides while guides exist", async ({ page }) => {
    await createShellPlan(page);
    await page.getByTestId("fit-plan").first().click();
    await expect(page.getByTestId("lr-auto-center-line")).toHaveCount(1);

    await placeGuide(page, "place-guide-x", 0.4, 0.5);
    await expect(guides(page)).toHaveCount(1);
    await expect(guides(page).first()).toHaveAttribute("data-guide-label", "A");
    await expect(page.getByTestId("lr-auto-center-line")).toHaveCount(0);

    await page.keyboard.press("Delete");
    await expect(guides(page)).toHaveCount(0);
    await expect(page.getByTestId("lr-auto-center-line")).toHaveCount(1);

    const layers = page.getByTestId("lr-plan-layers-panel").locator("summary");
    const centreToggle = page.locator(".lr-plan-titlebar").getByTestId("lr-center-line-toggle");
    await layers.click();
    await centreToggle.uncheck();
    await expect(page.getByTestId("lr-auto-center-line")).toHaveCount(0);
    await centreToggle.check();
    await expect(page.getByTestId("lr-auto-center-line")).toHaveCount(1);
    await layers.click();

    await placeGuide(page, "place-guide-x", 0.4, 0.5);
    await placeGuide(page, "place-guide-z", 0.5, 0.4);
    await expect(guides(page)).toHaveCount(2);
    await expect(page.locator('g.lr-plan-guide[data-guide-axis="z"]')).toHaveAttribute("data-guide-label", "1");

    const id = await guides(page).first().getAttribute("data-guide-id");
    const label = page.getByTestId(`lr-guide-label-${id}`);
    await label.fill("Grid A");
    await label.press("Enter");
    await expect(page.locator(`g.lr-plan-guide[data-guide-id="${id}"]`)).toHaveAttribute("data-guide-label", "Grid A");
  });

  test("clicking elsewhere on the plan drops the guide selection, so Delete leaves the guide", async ({ page }) => {
    await createShellPlan(page);
    await page.getByTestId("fit-plan").first().click();
    await placeGuide(page, "place-guide-x", 0.4, 0.5);
    await expect(page.locator("g.lr-plan-guide.is-selected")).toHaveCount(1);
    await page.locator('[data-build-tool="select"]').first().click();
    const elsewhere = await pointOnPaper(paper(page), 0.05, 0.95);
    await page.mouse.click(elsewhere.x, elsewhere.y);
    await expect(page.locator("g.lr-plan-guide.is-selected")).toHaveCount(0);
    await page.keyboard.press("Delete");
    await expect(guides(page)).toHaveCount(1);
  });

  test("guides survive Replace underlay and save → reopen", async ({ page }) => {
    await createShellPlan(page);
    await page.getByTestId("fit-plan").first().click();
    await importPng(page, "first-plan.png");
    await placeGuide(page, "place-guide-x", 0.35, 0.5);
    await placeGuide(page, "place-guide-z", 0.5, 0.35);
    await expect(guides(page)).toHaveCount(2);
    const positions = await guides(page).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-guide-position")));

    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Replace file", exact: true }).click();
    await (await chooser).setFiles({ name: "second-plan.png", mimeType: "image/png", buffer: TINY_PNG });
    await expect(page.getByTestId("lr-plan-underlay-image")).toBeVisible({ timeout: 15_000 });
    await expect(guides(page)).toHaveCount(2);

    const download = await saveProjectViaDownload(page);
    await reopenViaDownloadedJson(page, download);
    await expect(guides(page)).toHaveCount(2);
    const reopened = await guides(page).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-guide-position")));
    expect(reopened).toEqual(positions);
  });
});
