import { expect, test } from "@playwright/test";
import {
  GOLDEN_RUN_OBJECT_IDS,
  GOLDEN_RUN_ORIGINAL_WIDTH_MM,
  GOLDEN_RUN_REVISED_WIDTH_MM,
} from "../../src/domain/livingRoom/goldenRun";
import {
  openGoldenCabinetRun,
  openGoldenRunModelView,
  reviseBaseWidth,
  selectGoldenCabinet,
} from "./golden-cabinet-run.helpers";
import { openInteriorsHome } from "./plannerStart";
import {
  assertPresentTabletLayout,
  assertProjectsFocusSurvivesAutosaveRerender,
  assertProjectsFocusTrap,
  cabinetWidthNode,
  dismiss3dGuideIfVisible,
  openGoldenCabinetRunForRecovery,
  redoChord,
  TABLET_VIEWPORT,
  undoChord,
  waitForRecoveryAutosave,
} from "./phase-7-hardening.helpers";

test.describe("Phase 7 hardening", () => {
  test("Projects dialog traps focus and Escape restores the opener", async ({ page }) => {
    await openInteriorsHome(page);
    await assertProjectsFocusTrap(page);

    await openGoldenCabinetRun(page);
    const crumb = page.getByTestId("interiors-project-crumb");
    await crumb.click();
    await assertProjectsFocusTrap(page);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("interiors-projects-home")).toHaveCount(0);
    await expect(crumb).toBeFocused();
  });

  test("Projects dialog keeps later focus across parent autosave rerenders", async ({ page }) => {
    await openGoldenCabinetRun(page);
    await page.clock.install();
    await page.getByTestId("interiors-tool-cabinet").click();
    await reviseBaseWidth(page, GOLDEN_RUN_REVISED_WIDTH_MM);
    await page.getByTestId("interiors-project-crumb").click();
    await assertProjectsFocusSurvivesAutosaveRerender(page);
  });

  test("keyboard shortcuts switch views and undo a cabinet edit", async ({ page }) => {
    await openGoldenCabinetRun(page);
    await page.keyboard.press("2");
    await dismiss3dGuideIfVisible(page);
    await expect(page.getByRole("button", { name: "3D", exact: true })).toHaveClass(/is-active/);
    await page.keyboard.press("1");
    await expect(page.getByRole("button", { name: "2D", exact: true })).toHaveClass(/is-active/);
    await page.getByTestId("interiors-tool-cabinet").click();
    await reviseBaseWidth(page, GOLDEN_RUN_REVISED_WIDTH_MM);
    await page.keyboard.press(undoChord());
    await expect(cabinetWidthNode(page, GOLDEN_RUN_OBJECT_IDS.baseA))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_ORIGINAL_WIDTH_MM));
  });

  test("Present undo restores width and frozen quote shows stale after edits", async ({ page }) => {
    test.setTimeout(process.env.CI ? 120_000 : 60_000);
    await openGoldenCabinetRun(page);
    await page.getByTestId("interiors-present").click();
    await page.getByRole("button", { name: "Freeze quote", exact: true }).click();
    await expect(page.getByTestId("proposal-quote-status")).toContainText(/Frozen Rev/i);
    await page.getByTestId("interiors-tool-cabinet").click();
    await reviseBaseWidth(page, GOLDEN_RUN_REVISED_WIDTH_MM);
    await page.getByTestId("interiors-present").click();
    await expect(page.getByTestId("proposal-quote-status")).toContainText(/Stale · frozen Rev/i);
    await expect(page.getByTestId("proposal-stale")).toBeVisible();
    await page.keyboard.press(undoChord());
    await expect(cabinetWidthNode(page, GOLDEN_RUN_OBJECT_IDS.baseA))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_ORIGINAL_WIDTH_MM));
    await expect(page.getByTestId("proposal-quote-status")).toContainText(/matches live/i);
  });

  test("2D edits stay visible in 3D semantics", async ({ page }) => {
    await openGoldenCabinetRun(page);
    await page.getByTestId("interiors-tool-cabinet").click();
    await reviseBaseWidth(page, GOLDEN_RUN_REVISED_WIDTH_MM);
    await openGoldenRunModelView(page);
    await dismiss3dGuideIfVisible(page);
    await expect(cabinetWidthNode(page, GOLDEN_RUN_OBJECT_IDS.baseA))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_REVISED_WIDTH_MM));
  });

  test("tablet Cabinet Run keeps selection properties editable", async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await openGoldenCabinetRun(page);
    await page.getByTestId("interiors-tool-cabinet").click();
    await selectGoldenCabinet(page, GOLDEN_RUN_OBJECT_IDS.baseA);
    const inspector = page.getByTestId("interiors-inspector");
    await expect(inspector).toBeVisible();
    const width = inspector.getByRole("spinbutton", { name: "W mm" });
    await expect(width).toBeVisible();
    await width.fill(String(GOLDEN_RUN_REVISED_WIDTH_MM));
    await width.blur();
    await expect(cabinetWidthNode(page, GOLDEN_RUN_OBJECT_IDS.baseA))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_REVISED_WIDTH_MM));
  });

  test("tablet Present stacks panel and canvas without studio chrome", async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await openGoldenCabinetRun(page);
    await page.getByTestId("interiors-present").click();
    await assertPresentTabletLayout(page);
    await expect(page.locator(".lr-render-studio")).toHaveCount(0);
  });

  test("autosave recovery restores revised geometry after reload", async ({ page }) => {
    test.setTimeout(process.env.CI ? 120_000 : 60_000);
    await openGoldenCabinetRunForRecovery(page);
    await page.getByTestId("interiors-tool-cabinet").click();
    await reviseBaseWidth(page, GOLDEN_RUN_REVISED_WIDTH_MM);
    await waitForRecoveryAutosave(page);
    await page.reload();
    const interiorsTab = page.getByRole("button", { name: "Interiors", exact: true });
    if (await interiorsTab.count()) await interiorsTab.click();
    await expect(page.getByTestId("interiors-recovery")).toBeVisible();
    await page.getByTestId("interiors-recovery-restore").click();
    await expect(page.getByTestId("interiors-projects-home")).toHaveCount(0);
    await expect(page.getByTestId("interiors-project-crumb")).toContainText("Golden Cabinet Run");
    await expect(cabinetWidthNode(page, GOLDEN_RUN_OBJECT_IDS.baseA))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_REVISED_WIDTH_MM));
  });

  test("redo restores a undone cabinet width change", async ({ page }) => {
    await openGoldenCabinetRun(page);
    await page.getByTestId("interiors-tool-cabinet").click();
    await reviseBaseWidth(page, GOLDEN_RUN_REVISED_WIDTH_MM);
    await page.keyboard.press(undoChord());
    await expect(cabinetWidthNode(page, GOLDEN_RUN_OBJECT_IDS.baseA))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_ORIGINAL_WIDTH_MM));
    await page.keyboard.press(redoChord());
    await expect(cabinetWidthNode(page, GOLDEN_RUN_OBJECT_IDS.baseA))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_REVISED_WIDTH_MM));
  });
});
