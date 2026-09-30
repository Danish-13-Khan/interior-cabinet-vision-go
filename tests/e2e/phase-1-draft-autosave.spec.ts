import { expect, test, type Page } from "@playwright/test";
import { GOLDEN_RUN_OBJECT_IDS, GOLDEN_RUN_REVISED_WIDTH_MM } from "../../src/domain/livingRoom/goldenRun";
import { reviseBaseWidth } from "./golden-cabinet-run.helpers";
import { cabinetWidthNode, openGoldenCabinetRunForRecovery, waitForRecoveryAutosave } from "./phase-7-hardening.helpers";
import { clickInteriorsTool } from "./plannerStart";

/** Id of the project autosave wrote to the browser index (drafts are keyed by it). */
async function savedProjectId(page: Page): Promise<string> {
  const id = await page.evaluate(() => {
    const raw = window.localStorage.getItem("cabinet-designer-project-browser");
    const index = raw ? (JSON.parse(raw) as { id?: string }[]) : [];
    return index[0]?.id ?? null;
  });
  expect(id).toBeTruthy();
  return id!;
}

/** Overlay clicks fail the hit-target check, so a trial click proves the editor is blocked. */
async function editorBlocked(page: Page): Promise<boolean> {
  return page.getByTestId("interiors-save-state").click({ trial: true, timeout: 1_500 }).then(() => false, () => true);
}

async function expectGoldenReopened(page: Page) {
  await expect(page.getByTestId("interiors-projects-home")).toHaveCount(0);
  await expect(page.getByTestId("interiors-project-crumb")).toContainText("Golden Cabinet Run");
}

test.describe("Phase 1 draft autosave", () => {
  test("close and reopen keeps the edit without a prompt; a pending marker shows the recovery notice", async ({ page }) => {
    test.setTimeout(process.env.CI ? 120_000 : 60_000);
    await openGoldenCabinetRunForRecovery(page);
    await clickInteriorsTool(page, "cabinet");
    await reviseBaseWidth(page, GOLDEN_RUN_REVISED_WIDTH_MM);
    await waitForRecoveryAutosave(page);

    await page.reload();
    await expectGoldenReopened(page);
    await expect(page.getByTestId("interiors-recovery")).toHaveCount(0);
    await expect(page.getByTestId("interiors-activity-status").filter({ hasText: "Recovered from autosave" })).toHaveCount(0);
    await expect(cabinetWidthNode(page, GOLDEN_RUN_OBJECT_IDS.baseA))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_REVISED_WIDTH_MM));

    const projectId = await savedProjectId(page);
    await page.evaluate((key) => window.localStorage.setItem(key, "1"), `cabinet-draft-pending:${projectId}`);
    await page.reload();
    await expectGoldenReopened(page);
    await expect(page.getByTestId("interiors-recovery")).toHaveCount(0);
    await expect(page.getByTestId("interiors-activity-status")).toContainText("Recovered from autosave");
    await expect(cabinetWidthNode(page, GOLDEN_RUN_OBJECT_IDS.baseA))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_REVISED_WIDTH_MM));
  });

  test("a second tab on the same project is blocked until it takes over", async ({ page, context }) => {
    test.setTimeout(process.env.CI ? 120_000 : 60_000);
    await openGoldenCabinetRunForRecovery(page);
    await clickInteriorsTool(page, "cabinet");
    await reviseBaseWidth(page, GOLDEN_RUN_REVISED_WIDTH_MM);
    await waitForRecoveryAutosave(page);
    await expect(page.getByTestId("project-tab-lock")).toHaveCount(0);

    const second = await context.newPage();
    await second.addInitScript(() => {
      window.sessionStorage.setItem("golden-scene-semantics", "1");
    });
    await second.goto("/app");
    await expectGoldenReopened(second);
    const blocked = second.getByTestId("project-tab-lock");
    await expect(blocked).toBeVisible();
    await expect(blocked).toHaveAttribute("role", "alertdialog");
    await expect(second.getByTestId("project-tab-takeover")).toBeVisible();
    expect(await editorBlocked(second)).toBe(true);

    await second.getByTestId("project-tab-takeover").click();
    const firstLock = page.getByTestId("project-tab-lock");
    await expect(firstLock).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("project-tab-reload")).toBeVisible();
    expect(await editorBlocked(page)).toBe(true);
    await expect(second.getByTestId("project-tab-lock")).toHaveCount(0, { timeout: 10_000 });
    await expect(cabinetWidthNode(second, GOLDEN_RUN_OBJECT_IDS.baseA))
      .toHaveAttribute("data-width-mm", String(GOLDEN_RUN_REVISED_WIDTH_MM));
    expect(await editorBlocked(second)).toBe(false);
    await second.close();
  });
});
