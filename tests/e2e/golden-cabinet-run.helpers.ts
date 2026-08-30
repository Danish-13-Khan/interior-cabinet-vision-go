import { expect, type Page } from "@playwright/test";
import {
  GOLDEN_RUN_OBJECT_IDS,
  GOLDEN_RUN_REVISED_FINISH_ID,
} from "../../src/domain/livingRoom/goldenRun";

export async function openGoldenCabinetRun(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.sessionStorage.setItem("golden-scene-semantics", "1");
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors" }).click();
  await page.getByTestId("open-golden-cabinet-run").click();
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Golden Cabinet Run");
}

export async function selectGoldenCabinet(page: Page, objectId: string) {
  await page.locator(`[data-object-id="${objectId}"]`).first().click();
  await expect(page.locator(`[data-object-id="${objectId}"].is-selected`)).toBeVisible();
}

export async function reviseBaseWidth(page: Page, widthMm: number) {
  await selectGoldenCabinet(page, GOLDEN_RUN_OBJECT_IDS.baseA);
  const width = page.getByRole("spinbutton", { name: "W mm" });
  await width.fill(String(widthMm));
  await width.blur();
  await expect(page.locator(`[data-object-id="${GOLDEN_RUN_OBJECT_IDS.baseA}"]`))
    .toHaveAttribute("data-width-mm", String(widthMm));
}

export async function changeGoldenFinish(page: Page, objectId = GOLDEN_RUN_OBJECT_IDS.baseA) {
  await page.getByRole("button", { name: "2 · Build in 2D", exact: true }).click();
  await selectGoldenCabinet(page, objectId);
  const finish = page.getByTestId("cabinet-finish");
  await finish.selectOption(GOLDEN_RUN_REVISED_FINISH_ID);
  await expect(finish).toHaveValue(GOLDEN_RUN_REVISED_FINISH_ID);
}

export async function readSellTotal(page: Page) {
  const total = page.getByTestId("proposal-live-total");
  const raw = await total.getAttribute("data-sell-total");
  const value = Number(raw);
  expect(Number.isFinite(value) && value > 0).toBe(true);
  return value;
}

export async function captureProposalView(page: Page) {
  const renderButton = page.getByRole("button", { name: "Render Image" });
  await expect(renderButton).toBeEnabled({ timeout: 25_000 });
  await renderButton.click();
  await expect(page.getByAltText(/Render from/)).toBeVisible({ timeout: 30_000 });
}

export async function saveAndReopenGoldenRun(page: Page) {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Save/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("gcr-001-golden-cabinet-run.json");
  const target = testOutputPath(file.suggestedFilename());
  await file.saveAs(target);
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors" }).click();
  const home = page.getByRole("dialog", { name: "Start a living room project" });
  await expect(home).toBeVisible();
  await expect(home.getByText("Save a project to keep it here for quick access.")).toBeVisible();
  await expect(home.locator(".planner-v2-recents > div button")).toHaveCount(0);
  const chooserPromise = page.waitForEvent("filechooser");
  await home.getByRole("button", { name: "Open project", exact: true }).click();
  await (await chooserPromise).setFiles(target);
  await expect(home).toBeHidden({ timeout: 15_000 });
  await page.getByRole("button", { name: "2 · Build in 2D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("2D plan");
  await expect(page.locator(".lr-plan-titlebar")).toContainText("Golden Cabinet Run");
  await expect(page.locator(`[data-object-id="${GOLDEN_RUN_OBJECT_IDS.baseA}"]`)).toBeVisible();
  return target;
}

export async function expandEngineeringTree(page: Page) {
  const expand = page.locator(".cabinet-tree-twist:not(.is-leaf):not([disabled])[aria-label='Expand']");
  for (let step = 0; step < 24 && (await expand.count()) > 0; step += 1) {
    await expand.first().click();
  }
}

function testOutputPath(name: string) {
  return `${process.cwd()}/test-results/${name}`;
}
