import { expect, test } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

async function openStarterRoom(page: import("@playwright/test").Page) {
  await createShellPlan(page);
}

test("Phase G keeps millwork Design and hides Advanced Studio parity chrome", async ({ page }) => {
  await openStarterRoom(page);

  await page.getByTestId("interiors-tool-cabinet").click();
  await expect(page.getByTestId("interiors-tool-cabinet")).toBeVisible();
  await expect(page.getByTestId("interiors-cabinet-run-catalog")).toBeVisible();
  await expect(page.getByText("Cabinet families", { exact: true })).toBeVisible();

  await expect(page.getByRole("button", { name: /^Advanced$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Advanced Studio/i })).toHaveCount(0);
  await expect(page.getByText("Styleboard", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Autostyler", { exact: false })).toHaveCount(0);
});

test("Phase G keeps a shared canvas without Advanced panel", async ({ page }) => {
  await openStarterRoom(page);
  await expect(page.getByTestId("interiors-tool-select")).toBeVisible();
  await page.getByTestId("interiors-tool-cabinet").click();
  await expect(page.getByTestId("interiors-cabinet-run-catalog")).toBeVisible();
  await page.getByTestId("interiors-present").click();
  await expect(page.getByTestId("interiors-present-titlebar")).toContainText("Present and Send");
  await expect(page.getByRole("button", { name: "Advanced", exact: true })).toHaveCount(0);
});
