import { expect, test, type Page } from "@playwright/test";

const OAK_ID = "lr-material-natural-oak";
const WALNUT_ID = "lr-material-walnut";

async function openDesignPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
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
  await page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ }).click();
  await expect(page.locator("[data-object-id]")).toHaveCount(1);
  await setObjectPosition(page, "X", "-1400");

  await page.locator(".lr-asset-grid").getByRole("button", { name: /Wall Cabinet.*Place/ }).click();
  await expect(page.locator("[data-object-id]")).toHaveCount(2);
  await setObjectPosition(page, "X", "1400");
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
  await placeTwoSeparatedCabinets(page);

  const objects = page.locator("[data-object-id]");
  // Defaults tint from fronts (oak); paint fronts → walnut so the plan attribute changes.
  await expect(objects.nth(0)).toHaveAttribute("data-material-id", OAK_ID);
  const originalFront = await objects.nth(0).getAttribute("data-material-id");

  await objects.nth(0).click();
  await objects.nth(1).click({ modifiers: ["Shift"] });
  await expect(page.locator(".lr-plan-object.is-selected")).toHaveCount(2);

  await page.getByTestId("interiors-tool-material").click();
  await page.getByRole("tab", { name: /Selection/ }).click();
  await page.getByLabel("Selection material slot").selectOption("fronts");
  await page.locator(`.lr-surface-painter [data-material-id="${WALNUT_ID}"]`).click();

  await expect(objects.nth(0)).toHaveAttribute("data-material-id", WALNUT_ID);
  await expect(objects.nth(1)).toHaveAttribute("data-material-id", WALNUT_ID);

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(objects.nth(0)).toHaveAttribute("data-material-id", originalFront!);
  await expect(objects.nth(1)).toHaveAttribute("data-material-id", originalFront!);

  // Select stays in Material context; open Build Room before using wall tabs.
  await page.getByTestId("interiors-tool-wall").click();
  await page.locator(".lr-wall-tabs").getByRole("button", { name: "front", exact: true }).click();
  await page.locator(".lr-opening-row").filter({ hasText: "door" }).click();
  const leafSlot = page.locator('.lr-opening-inspector [data-material-slot="leaf"]');
  await expect(leafSlot).toBeVisible();
  await leafSlot.locator(`[data-material-id="${OAK_ID}"]`).click();
  await expect(leafSlot.locator(`[data-material-id="${OAK_ID}"]`)).toHaveClass(/is-active/);
});
