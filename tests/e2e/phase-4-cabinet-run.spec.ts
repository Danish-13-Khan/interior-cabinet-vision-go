import { expect, test, type Page } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

async function placedObjectIds(page: Page) {
  return (await page.locator("[data-object-id]").evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-object-id")),
  )).filter((id): id is string => Boolean(id));
}

async function setObjectX(page: Page, value: string) {
  const field = page.locator(".lr-inspector-scroll").getByRole("spinbutton", { name: "X mm", exact: true });
  await field.fill(value);
  await field.blur();
  await expect(field).toHaveValue(value);
}

test("Phase 4 places cabinet families, snaps a run, and keeps 2D/3D selection", async ({ page }) => {
  await createShellPlan(page);
  await page.getByTestId("interiors-tool-cabinet").click();
  await expect(page.getByTestId("interiors-cabinet-run-titlebar")).toContainText("Cabinet run");
  await expect(page.getByTestId("interiors-tool-run")).toBeEnabled();
  await expect(page.getByTestId("interiors-tool-shelf")).toBeEnabled();
  await expect(page.getByTestId("interiors-cabinet-run-catalog")).toBeVisible();
  await expect(page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ })).toBeVisible();
  await expect(page.locator(".lr-asset-grid").getByRole("button", { name: /Open Shelf.*Place/ })).toBeVisible();

  const before = await placedObjectIds(page);
  await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
  await expect(page.locator("[data-object-id]")).toHaveCount(before.length + 1);
  const afterBase = await placedObjectIds(page);
  const baseId = afterBase.find((id) => !before.includes(id));
  if (!baseId) throw new Error("Placed base cabinet was not found");
  const base = page.locator(`[data-object-id="${baseId}"]`);
  await expect(base).toHaveAttribute("data-cabinet-type", "base");
  await expect(base).toHaveAttribute("data-family-id", "frameless-standard-base");
  await setObjectX(page, "-1200");
  const width = page.getByRole("spinbutton", { name: "W mm" });
  await width.fill("800");
  await width.blur();
  await expect(base).toHaveAttribute("data-width-mm", "800");
  await expect(page.getByRole("spinbutton", { name: "Drawer count mm" })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Shelf count mm" })).toBeVisible();

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await expect(page.getByRole("spinbutton", { name: "W mm" })).toHaveValue("800");
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.getByTestId("interiors-cabinet-run-titlebar")).toBeVisible();
  await expect(base).toHaveClass(/is-selected/);

  await page.locator(".lr-asset-grid").getByRole("button", { name: /Drawer Bank.*Place/ }).click();
  await expect(page.locator("[data-object-id]")).toHaveCount(before.length + 2);
  const afterDrawer = await placedObjectIds(page);
  const drawerId = afterDrawer.find((id) => !afterBase.includes(id));
  if (!drawerId) throw new Error("Placed drawer cabinet was not found");
  await setObjectX(page, "1200");
  await base.click();
  await page.locator(`[data-object-id="${drawerId}"]`).click({ modifiers: ["Shift"] });
  await page.getByTestId("interiors-tool-run").click();
  const wallId = await base.getAttribute("data-wall-id");
  expect(wallId).toBeTruthy();
  await page.getByRole("button", { name: "Snap selection into run" }).click();
  await expect(base).toHaveAttribute("data-wall-id", wallId!);
  await expect(page.locator(`[data-object-id="${drawerId}"]`)).toHaveAttribute("data-wall-id", wallId!);
  await expect(page.getByTestId("cabinet-run-length")).toBeVisible();
  await expect(page.getByTestId("cabinet-run-length")).toHaveAttribute("data-length-mm", "1700");
  await expect(page.getByTestId("cabinet-run-length")).toContainText("1700");
  await expect(page.getByTestId("interiors-cabinet-run-countertop-hint")).toBeVisible();
  await page.getByTestId("interiors-cabinet-run-tray").getByRole("checkbox", { name: "Auto fillers" }).check();
  await expect(page.getByTestId("interiors-cabinet-run-status")).toContainText(/1 run/);

  await page.getByTestId("interiors-tool-shelf").click();
  await expect(page.locator(".lr-asset-grid > button")).toHaveCount(1);
  await expect(page.locator(".lr-asset-grid").getByRole("button", { name: /Open Shelf.*Place/ })).toBeVisible();

  await page.getByTestId("interiors-tool-material").click();
  await expect(page.getByText("Material Browser", { exact: true })).toBeVisible();
});
