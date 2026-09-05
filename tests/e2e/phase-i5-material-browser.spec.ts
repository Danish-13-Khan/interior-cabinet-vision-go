import { expect, test, type Page } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

const OAK_ID = "lr-material-natural-oak";
const WALNUT_ID = "lr-material-walnut";

async function openDesignPlan(page: Page) {
  await createShellPlan(page);
  await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();
  await page.getByTestId("interiors-tool-cabinet").click();
}

async function setObjectPosition(page: Page, axis: "X" | "Z", value: string) {
  const field = page.locator(".lr-inspector-scroll").getByRole("spinbutton", { name: `${axis} mm`, exact: true });
  await field.fill(value);
  await field.blur();
  await expect(field).toHaveValue(value);
}

/**
 * Wall-attached catalog items stack on the same wall center.
 * Offset each cabinet before selecting so plan clicks are not intercepted.
 */
async function placeTwoSeparatedCabinets(page: Page) {
  const objects = page.locator("[data-object-id]");
  const initialIds = (await objects.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-object-id")),
  )).filter((id): id is string => Boolean(id));

  await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
  await expect(objects).toHaveCount(initialIds.length + 1);
  await setObjectPosition(page, "X", "-1400");
  const baseIds = (await objects.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-object-id")),
  )).filter((id): id is string => Boolean(id));
  const baseId = baseIds.find((id) => !initialIds.includes(id));
  if (!baseId) throw new Error("Placed base cabinet was not found");

  await page.locator(".lr-asset-grid").getByRole("button", { name: /Wall Cabinet.*Place/ }).click();
  await expect(objects).toHaveCount(initialIds.length + 2);
  await setObjectPosition(page, "X", "1400");
  const finalIds = (await objects.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-object-id")),
  )).filter((id): id is string => Boolean(id));
  const wallId = finalIds.find((id) => !baseIds.includes(id));
  if (!wallId) throw new Error("Placed wall cabinet was not found");

  return { baseId, wallId };
}

test("I5 paints shared finishes, undoes paint, and edits opening materials", async ({ page }) => {
  await openDesignPlan(page);
  await page.getByTestId("interiors-tool-material").click();
  await expect(page.getByText("Material Browser", { exact: true })).toBeVisible();

  const oak = page.locator(`[aria-label="Material browser"] [data-material-id="${OAK_ID}"]`).first();
  await expect(oak).toBeVisible();
  await oak.click();
  await expect(oak).toHaveClass(/is-active/);

  await page.getByTestId("interiors-tool-cabinet").click();
  const { baseId, wallId } = await placeTwoSeparatedCabinets(page);

  const base = page.locator(`[data-object-id="${baseId}"]`);
  const wall = page.locator(`[data-object-id="${wallId}"]`);
  // Defaults tint from fronts (oak); paint fronts → walnut so the plan attribute changes.
  await expect(base).toHaveAttribute("data-material-id", OAK_ID);
  const originalFront = await base.getAttribute("data-material-id");

  await base.click();
  await wall.click({ modifiers: ["Shift"] });
  await expect(page.locator(".lr-plan-object.is-selected")).toHaveCount(2);

  await page.getByTestId("interiors-tool-material").click();
  await page.getByRole("tab", { name: /Selection/ }).click();
  await page.getByLabel("Selection material slot").selectOption("fronts");
  await page.locator(`.lr-surface-painter [data-material-id="${WALNUT_ID}"]`).click();

  await expect(base).toHaveAttribute("data-material-id", WALNUT_ID);
  await expect(wall).toHaveAttribute("data-material-id", WALNUT_ID);

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(base).toHaveAttribute("data-material-id", originalFront!);
  await expect(wall).toHaveAttribute("data-material-id", originalFront!);

  await page.getByTestId("interiors-tool-select").click();
  const openingLine = page.locator("g[data-opening-id]").first().locator("line").first();
  const openingBox = await openingLine.boundingBox();
  if (!openingBox) throw new Error("Opening is not rendered");
  await page.mouse.click(openingBox.x + openingBox.width / 2, openingBox.y + openingBox.height / 2);
  const leafSlot = page.locator('.lr-opening-inspector [data-material-slot="leaf"]');
  await expect(leafSlot).toBeVisible();
  await leafSlot.locator(`[data-material-id="${OAK_ID}"]`).click();
  await expect(leafSlot.locator(`[data-material-id="${OAK_ID}"]`)).toHaveClass(/is-active/);
});
