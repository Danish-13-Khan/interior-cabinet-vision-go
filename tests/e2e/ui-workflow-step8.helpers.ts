import { expect, type Page } from "@playwright/test";
import {
  WORKFLOW_ENTRY_POINTS,
  type WorkflowEntryPoint,
} from "../../src/domain/desktopUx/interiorsWorkflowEntryPoints";
import { selectInteriorsWorkflowArea, clickInteriorsTool } from "./plannerStart";
import { selectGoldenCabinet } from "./golden-cabinet-run.helpers";

/** Visit every free design area and assert its signature control. */
export async function assertWorkflowAreasSmoke(page: Page) {
  for (const entry of WORKFLOW_ENTRY_POINTS) {
    await assertWorkflowAreaEntry(page, entry);
  }
}

export async function assertWorkflowAreaEntry(page: Page, entry: WorkflowEntryPoint) {
  await selectInteriorsWorkflowArea(page, entry.area);
  await expect(page.getByTestId(entry.areaTestId)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId(entry.signatureTestId)).toBeVisible();
}

/** Present → Return to Review → Cabinets edit selection (Step 7/8 path). */
export async function leavePresentForCabinetEdit(page: Page, objectId: string) {
  const returnReview = page.getByTestId("interiors-present-return-review");
  if (await returnReview.count()) {
    await returnReview.click();
    await expect(page.getByTestId("interiors-review-panel")).toBeVisible();
  } else {
    await selectInteriorsWorkflowArea(page, "review");
  }
  await clickInteriorsTool(page, "cabinet");
  await page.getByRole("button", { name: "2D", exact: true }).click();
  // Cabinet tool keeps the Cabinet-run titlebar on plan (not generic "Room plan").
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Cabinet run");
  await expect(page.locator(".lr-plan-svg")).toBeVisible();
  await selectGoldenCabinet(page, objectId);
}
