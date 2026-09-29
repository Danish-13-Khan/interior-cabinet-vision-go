import { expect, test, type Page } from "@playwright/test";
import { clickInteriorsTool, createShellPlan } from "./plannerStart";

// The selected-object inspector also carries data-object-id; count plan objects only.
const PLAN_OBJECT = ".lr-plan-object[data-object-id]";

async function placedObjectIds(page: Page) {
  return (await page.locator(PLAN_OBJECT).evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-object-id")),
  )).filter((id): id is string => Boolean(id));
}

/** Inspector sections other than Size start collapsed in the 2D plan. */
async function openInspectorSection(page: Page, name: string) {
  const section = page.locator(".lr-inspector-scroll details").filter({
    has: page.locator("summary", { hasText: new RegExp(`^${name}$`, "i") }),
  }).first();
  if (!(await section.evaluate((el) => (el as HTMLDetailsElement).open))) {
    await section.locator("summary").first().click();
  }
}

async function setObjectX(page: Page, value: string) {
  await openInspectorSection(page, "Position");
  const field = page.locator(".lr-inspector-scroll").getByRole("spinbutton", { name: "X mm", exact: true });
  await field.fill(value);
  await field.blur();
  await expect(field).toHaveValue(value);
}

test("Phase 4 places cabinet families, snaps a run, and keeps 2D/3D selection", async ({ page }) => {
  await createShellPlan(page);
  await clickInteriorsTool(page, "cabinet");
  await expect(page.getByTestId("interiors-cabinet-run-titlebar")).toContainText("Cabinet run");
  await expect(page.getByTestId("interiors-tool-run")).toBeEnabled();
  await expect(page.getByTestId("interiors-tool-shelf")).toBeEnabled();
  await expect(page.getByTestId("interiors-cabinet-run-catalog")).toBeVisible();
  await expect(page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ })).toBeVisible();
  await expect(page.locator(".lr-asset-grid").getByRole("button", { name: /Open Shelf.*Place/ })).toBeVisible();

  const before = await placedObjectIds(page);
  await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
  await expect(page.locator(PLAN_OBJECT)).toHaveCount(before.length + 1);
  const afterBase = await placedObjectIds(page);
  const baseId = afterBase.find((id) => !before.includes(id));
  if (!baseId) throw new Error("Placed base cabinet was not found");
  const base = page.locator(`.lr-plan-object[data-object-id="${baseId}"]`);
  await expect(base).toHaveAttribute("data-cabinet-type", "base");
  await expect(base).toHaveAttribute("data-family-id", "frameless-standard-base");
  await setObjectX(page, "-1200");
  const width = page.getByRole("spinbutton", { name: "W mm" });
  await width.fill("800");
  await width.blur();
  await expect(base).toHaveAttribute("data-width-mm", "800");
  await openInspectorSection(page, "Construction");
  await expect(page.getByRole("spinbutton", { name: "Drawer count mm" })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Shelf count mm" })).toBeVisible();

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await expect(page.getByRole("spinbutton", { name: "W mm" })).toHaveValue("800");
  await page.getByRole("button", { name: "2D plan", exact: true }).click();
  await expect(page.getByTestId("interiors-cabinet-run-titlebar")).toBeVisible();
  await expect(base).toHaveClass(/is-selected/);

  await page.locator(".lr-asset-grid").getByRole("button", { name: /Drawer Bank.*Place/ }).click();
  await expect(page.locator(PLAN_OBJECT)).toHaveCount(before.length + 2);
  const afterDrawer = await placedObjectIds(page);
  const drawerId = afterDrawer.find((id) => !afterBase.includes(id));
  if (!drawerId) throw new Error("Placed drawer cabinet was not found");
  await setObjectX(page, "1200");
  const drawer = page.locator(`.lr-plan-object[data-object-id="${drawerId}"]`);
  await clickInteriorsTool(page, "run");
  // Clicking the centre hits the inline W×D label, which opens the size editor instead of selecting.
  const edge = { x: 12, y: 12 };
  await base.locator(":scope > rect").first().click({ position: edge });
  await drawer.locator(":scope > rect").first().click({ position: edge, modifiers: ["Shift"] });
  await expect(page.locator(".lr-plan-object.is-selected")).toHaveCount(2);
  const wallId = await base.getAttribute("data-wall-id");
  expect(wallId).toBeTruthy();
  await page.getByRole("button", { name: "Snap selection into run" }).click();
  await expect(base).toHaveAttribute("data-wall-id", wallId!);
  await expect(drawer).toHaveAttribute("data-wall-id", wallId!);
  await expect(page.getByTestId("cabinet-run-length")).toBeVisible();
  await expect(page.getByTestId("cabinet-run-length")).toHaveAttribute("data-length-mm", "1700");
  await expect(page.getByTestId("cabinet-run-length")).toContainText("1700");
  await expect(page.getByTestId("interiors-cabinet-run-countertop-hint")).toBeVisible();
  await page.getByTestId("interiors-cabinet-run-tray").getByRole("checkbox", { name: "Auto fillers" }).check();
  await expect(page.getByTestId("interiors-cabinet-run-status")).toContainText(/1 run/);

  await clickInteriorsTool(page, "shelf");
  await expect(page.locator(".lr-asset-grid > button")).toHaveCount(1);
  await expect(page.locator(".lr-asset-grid").getByRole("button", { name: /Open Shelf.*Place/ })).toBeVisible();

  await clickInteriorsTool(page, "material");
  await expect(page.getByText("Material Browser", { exact: true })).toBeVisible();
});
