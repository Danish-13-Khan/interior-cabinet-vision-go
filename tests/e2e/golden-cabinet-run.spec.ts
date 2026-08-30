import { expect, test } from "@playwright/test";
import {
  GOLDEN_RUN_FILLER_IDS,
  GOLDEN_RUN_JOB,
  GOLDEN_RUN_OBJECT_IDS,
  GOLDEN_RUN_REVISED_FINISH_ID,
  GOLDEN_RUN_REVISED_WIDTH_MM,
} from "../../src/domain/livingRoom/goldenRun";
import {
  captureProposalView,
  changeGoldenFinish,
  expandEngineeringTree,
  openGoldenCabinetRun,
  readSellTotal,
  reviseBaseWidth,
  saveAndReopenGoldenRun,
} from "./golden-cabinet-run.helpers";

test.describe.configure({ mode: "serial" });

test("P0-E Golden Cabinet Run: open, revise, quote, save/reopen, engineering", async ({ page }) => {
  test.setTimeout(180_000);
  let quoteBefore = 0;
  let cutlistBefore = "";

  await test.step("open-benchmark", async () => {
    await openGoldenCabinetRun(page);
  });

  await test.step("confirm-room", async () => {
    await expect(page.locator("[data-room-floor]")).toBeVisible();
    await expect(page.locator("g.lr-opening-door")).toHaveCount(1);
    await expect(page.locator("g.lr-opening-window")).toHaveCount(1);
    await expect(page.locator("[data-object-id][data-cabinet-type]")).toHaveCount(8);
  });

  await test.step("confirm-cabinets", async () => {
    await expect(page.locator('[data-cabinet-type="base"]')).toHaveCount(2);
    await expect(page.locator('[data-cabinet-type="wall"]')).toHaveCount(2);
    await expect(page.locator('[data-cabinet-type="tall"]')).toHaveCount(1);
    await expect(page.locator('[data-cabinet-type="drawer"]')).toHaveCount(1);
    await expect(page.locator(`[data-object-id="${GOLDEN_RUN_OBJECT_IDS.baseA}"]`)).toHaveAttribute("data-family-id", "frameless-standard-base");
  });

  await test.step("confirm-run", async () => {
    await expect(page.locator("[data-object-id][data-wall-id]").first()).toHaveAttribute("data-wall-id", /golden-run-wall-back/);
    await expect(page.locator('[data-cabinet-type="filler"]')).toHaveCount(2);
  });

  await test.step("revise-width", async () => {
    await page.getByRole("button", { name: "4 · Review + export", exact: true }).click();
    quoteBefore = await readSellTotal(page);
    await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
    cutlistBefore = (await page.getByTestId("cutlist-part-count").textContent()) ?? "";
    await reviseBaseWidth(page, GOLDEN_RUN_REVISED_WIDTH_MM);
  });

  await test.step("change-material", async () => {
    await changeGoldenFinish(page);
    await expect(page.getByTestId("cabinet-finish")).toHaveValue(GOLDEN_RUN_REVISED_FINISH_ID);
  });

  await test.step("assert-cutlist", async () => {
    await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
    const cutlist = page.getByTestId("cutlist-part-count");
    await expect(cutlist).toBeVisible();
    await expect(cutlist).toContainText(/cut parts/);
    await expect(cutlist).toContainText(/cut width/);
    if (cutlistBefore) await expect(cutlist).not.toHaveText(cutlistBefore);
    await expect(page.locator(`[data-object-id="${GOLDEN_RUN_OBJECT_IDS.baseA}"]`))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_REVISED_WIDTH_MM));
  });

  await test.step("review-3d", async () => {
    await page.getByRole("button", { name: "3D", exact: true }).click();
    await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
    await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  });

  await test.step("assert-3d", async () => {
    const semantics = page.getByTestId("lr-scene-semantics");
    await expect(semantics).toBeAttached();
    await expect(semantics.locator('[data-cabinet-type="base"][data-geometry="shared-cabinet"]')).toHaveCount(2);
    const walls = semantics.locator('[data-cabinet-type="wall"]');
    await expect(walls).toHaveCount(2);
    await expect(walls.first()).toHaveAttribute("data-y-mm", "1400");
    await expect(walls.nth(1)).toHaveAttribute("data-y-mm", "1400");
    await expect(semantics.locator(`[data-object-id="${GOLDEN_RUN_OBJECT_IDS.baseA}"]`))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_REVISED_WIDTH_MM));
    await expect(semantics.locator('[data-cabinet-type="base"]').first()).toHaveAttribute("data-roles", /fronts/);
    await expect(semantics.locator('[data-cabinet-type="base"]').first()).toHaveAttribute("data-roles", /toe-kick/);
    await expect(walls.first()).not.toHaveAttribute("data-roles", /toe-kick/);
    await expect(semantics.locator('[data-role="countertop"]')).not.toHaveCount(0);
    await expect(semantics.locator(`[data-role="countertop"][data-cabinet-ids*="${GOLDEN_RUN_OBJECT_IDS.baseA}"]`))
      .toHaveCount(1);
  });

  await test.step("assert-quote", async () => {
    await page.getByRole("button", { name: "4 · Review + export", exact: true }).click();
    await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Render studio");
    const quoteAfter = await readSellTotal(page);
    expect(quoteAfter).not.toBe(quoteBefore);
    quoteBefore = quoteAfter;
    await expect(page.getByTestId("review-millwork-line").first()).toBeVisible();
  });

  await test.step("freeze-quote", async () => {
    await page.getByRole("button", { name: "Freeze quote", exact: true }).click();
    await expect(page.getByTestId("proposal-quote-status")).toContainText(/Frozen Rev A/i);
  });

  await test.step("create-proposal", async () => {
    await captureProposalView(page);
    await expect(page.getByTestId("create-proposal")).toBeEnabled();
    const download = page.waitForEvent("download");
    await page.getByTestId("create-proposal").click();
    const pdf = await download;
    expect(pdf.suggestedFilename()).toMatch(/gcr-001-rev-a-proposal/i);
    await expect(page.locator(".planner-v2-review-status")).toContainText(/Proposal PDF/i);
  });

  await test.step("save-project", async () => {
    await saveAndReopenGoldenRun(page);
  });

  await test.step("reopen-project", async () => {
    await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("2D plan");
    await expect(page.locator(`[data-object-id="${GOLDEN_RUN_OBJECT_IDS.baseA}"]`))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_REVISED_WIDTH_MM));
    await page.locator(`[data-object-id="${GOLDEN_RUN_OBJECT_IDS.baseA}"]`).click();
    await expect(page.getByTestId("cabinet-finish")).toHaveValue(GOLDEN_RUN_REVISED_FINISH_ID);
    await page.getByRole("button", { name: "4 · Review + export", exact: true }).click();
    await expect(page.getByTestId("proposal-quote-status")).toContainText(/Frozen Rev A/i);
    await expect(page.getByTestId("proposal-live-total")).toHaveAttribute("data-sell-total", String(quoteBefore));
    await expect(page.getByTestId("handoff-revision")).toContainText(`Rev ${GOLDEN_RUN_JOB.revision}`);
    await expect(page.getByTestId("handoff-summary").locator(`[data-cabinet-id="${GOLDEN_RUN_FILLER_IDS.start}"]`)).toHaveCount(1);
    await expect(page.getByTestId("handoff-summary").locator(`[data-cabinet-id="${GOLDEN_RUN_FILLER_IDS.end}"]`)).toHaveCount(1);
  });

  await test.step("send-engineering", async () => {
    await expect(page.getByTestId("handoff-summary")).toContainText(GOLDEN_RUN_OBJECT_IDS.baseA);
    await page.getByTestId("approve-engineering-revision").click();
    await expect(page.getByTestId("handoff-approved")).toBeVisible();
    const send = page.getByTestId("send-to-engineering");
    await expect(send).toBeEnabled();
    await send.click();
  });

  await test.step("assert-ids", async () => {
    await expect(page.getByRole("button", { name: "Cabinets", exact: true })).toHaveAttribute("aria-current", "page");
    await expandEngineeringTree(page);
    for (const objectId of Object.values(GOLDEN_RUN_OBJECT_IDS)) {
      const row = page.locator(`.cabinet-tree-row[data-kind="cabinet"][data-cabinet-id="${objectId}"]`);
      await expect(row).toHaveCount(1);
      await expect(row).toHaveAttribute("data-cabinet-type", /base|wall|tall|drawer/);
    }
    for (const fillerId of Object.values(GOLDEN_RUN_FILLER_IDS)) {
      const row = page.locator(`.cabinet-tree-row[data-kind="cabinet"][data-cabinet-id="${fillerId}"]`);
      await expect(row).toHaveCount(1);
      await expect(row).toHaveAttribute("title", /filler/i);
    }
  });

  await test.step("verify-revision", async () => {
    await page.getByRole("button", { name: "Production", exact: true }).click();
    const revision = page.getByTestId("production-revision");
    await expect(revision).toContainText(GOLDEN_RUN_JOB.projectNumber);
    await expect(revision).toContainText(`Rev ${GOLDEN_RUN_JOB.revision}`);
    await page.getByRole("tab", { name: "Cutlist" }).click();
    await expect(page.getByText("Workshop Cutlist")).toBeVisible();
    await expect(page.locator(`[data-cabinet-id="${GOLDEN_RUN_OBJECT_IDS.baseA}"]`).first()).toBeVisible();
    await expect(page.locator(`[data-cabinet-id="${GOLDEN_RUN_FILLER_IDS.start}"]`).first()).toBeVisible();
    await expect(page.getByTestId("production-revision")).toContainText(GOLDEN_RUN_JOB.projectNumber);
  });
});
