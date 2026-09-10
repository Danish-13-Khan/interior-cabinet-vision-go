import { expect, test } from "@playwright/test";
import { GOLDEN_RUN_OBJECT_IDS } from "../../src/domain/livingRoom/goldenRun";
import { openGoldenCabinetRun } from "./golden-cabinet-run.helpers";
import { reopenViaDownloadedJson, saveProjectViaDownload } from "./interiorsSaveReopen";
import { openInteriorsHome } from "./plannerStart";
import {
  assertWorkflowAreasSmoke,
  leavePresentForCabinetEdit,
} from "./ui-workflow-step8.helpers";

test.describe("UI workflow Step 8 verification", () => {
  test("empty-room starter exposes every workflow area entry point", async ({ page }) => {
    test.setTimeout(process.env.CI ? 180_000 : 90_000);
    await openInteriorsHome(page);
    await page.getByTestId("catalog-template-template:core:empty-room:v1").click();
    await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeHidden();
    await expect(page.locator(".lr-plan-titlebar")).toContainText("Empty Room");

    await assertWorkflowAreasSmoke(page);

    await page.getByTestId("interiors-workflow-area-review").click();
    await expect(page.getByTestId("interiors-review-present")).toBeVisible();
    await page.getByTestId("interiors-review-present").click();
    await expect(page.getByTestId("interiors-present-titlebar")).toContainText("Present and Send");
    await expect(page.getByTestId("lr-model-viewport")).toHaveClass(/is-client-presentation/);
  });

  test("golden run Present returns to Review then allows cabinet edit and save/reopen", async ({ page }) => {
    test.setTimeout(process.env.CI ? 240_000 : 120_000);
    await openGoldenCabinetRun(page);
    await page.getByTestId("interiors-present").click();
    await expect(page.getByTestId("interiors-present-titlebar")).toContainText("Present and Send");
    await expect(page.getByTestId("interiors-present-return-review")).toBeVisible();

    await leavePresentForCabinetEdit(page, GOLDEN_RUN_OBJECT_IDS.baseA);
    const selectedIdentity = page.locator(`.lr-object-identity[data-object-id="${GOLDEN_RUN_OBJECT_IDS.baseA}"]`);
    await expect(selectedIdentity).toBeVisible();
    await expect(selectedIdentity.getByText("Millwork item", { exact: true })).toBeVisible();
    await expect(page.getByRole("spinbutton", { name: "W mm" })).toBeVisible();

    const download = await saveProjectViaDownload(page);
    expect(download.suggestedFilename().toLowerCase()).toMatch(/gcr|golden|cabinet|\.json$/);
    await reopenViaDownloadedJson(page, download);
    await expect(page.getByTestId("interiors-project-crumb")).toContainText("Golden Cabinet Run");
    await expect(page.locator(`[data-object-id="${GOLDEN_RUN_OBJECT_IDS.baseA}"]`)).toBeAttached();
  });
});
