import { expect, test } from "@playwright/test";
import { GOLDEN_RUN_OBJECT_IDS, GOLDEN_RUN_REVISED_WIDTH_MM } from "../../src/domain/livingRoom/goldenRun";
import {
  captureProposalView,
  expandEngineeringTree,
  openGoldenCabinetRun,
  readSellTotal,
  reviseBaseWidth,
} from "./golden-cabinet-run.helpers";

test("Phase 5 Present freezes, proposes, approves, and sends", async ({ page }) => {
  test.setTimeout(process.env.CI ? 480_000 : 240_000);
  await openGoldenCabinetRun(page);
  await page.getByTestId("interiors-present").click();
  await expect(page.getByTestId("interiors-present-titlebar")).toContainText("Present and Send");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  await expect(page.getByTestId("proposal-live-total")).toBeVisible();
  await expect(page.getByLabel("Markup %")).toBeVisible();
  await expect(page.getByLabel("Discount %")).toBeVisible();
  await expect(page.getByTestId("interiors-present-validity")).toBeVisible();
  await expect(page.getByRole("button", { name: "Schedule CSV" })).toHaveCount(0);

  const before = await readSellTotal(page);
  await page.getByTestId("interiors-tool-cabinet").click();
  await reviseBaseWidth(page, GOLDEN_RUN_REVISED_WIDTH_MM);
  await page.getByTestId("interiors-present").click();
  const afterRevise = await readSellTotal(page);
  expect(afterRevise).not.toBe(before);

  await page.getByLabel("Markup %").fill("25");
  await page.getByLabel("Markup %").blur();
  const afterMarkup = await readSellTotal(page);
  expect(afterMarkup).not.toBe(afterRevise);

  await page.getByRole("button", { name: "Freeze quote", exact: true }).click();
  await expect(page.getByTestId("proposal-quote-status")).toContainText(/Frozen Rev/i);
  await expect(page.getByTestId("handoff-revision")).toBeVisible();
  await expect(page.getByTestId("interiors-present-panel")).toHaveAttribute("data-step", "capture");
  await expect(page.getByTestId("create-proposal")).toBeDisabled();
  await expect(page.getByTestId("approve-engineering-revision")).toBeDisabled();

  await captureProposalView(page);
  await expect(page.getByTestId("interiors-present-panel")).toHaveAttribute("data-step", "proposal");
  await expect(page.getByTestId("create-proposal")).toBeEnabled();
  await expect(page.getByTestId("approve-engineering-revision")).toBeDisabled();
  const download = page.waitForEvent("download");
  await page.getByTestId("create-proposal").click();
  expect((await download).suggestedFilename()).toMatch(/gcr-001-rev-a-proposal/i);
  await expect(page.getByTestId("interiors-present-panel")).toHaveAttribute("data-step", "approve");
  await expect(page.getByTestId("approve-engineering-revision")).toBeEnabled();
  await expect(page.getByTestId("send-to-engineering")).toBeDisabled();

  await page.getByTestId("approve-engineering-revision").evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByTestId("handoff-approved")).toBeVisible();
  await expect(page.getByTestId("interiors-present-panel")).toHaveAttribute("data-step", "send");
  await expect(page.getByTestId("send-to-engineering")).toBeEnabled();
  await page.getByTestId("send-to-engineering").evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole("button", { name: "Cabinets", exact: true })).toHaveAttribute("aria-current", "page");
  await expandEngineeringTree(page);
  await expect(page.locator(`.cabinet-tree-row[data-kind="cabinet"][data-cabinet-id="${GOLDEN_RUN_OBJECT_IDS.baseA}"]`))
    .toHaveCount(1);
});
