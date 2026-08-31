import { expect, test, type Page } from "@playwright/test";

async function openDesignPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
  await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();
  await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
  await expect(page.getByText("Millwork Design", { exact: true })).toBeVisible();
}

async function placeCatalogCabinet(page: Page) {
  await page.locator(".lr-asset-grid").getByRole("button", { name: /Wardrobe Wall.*Place/ }).click();
}

async function setObjectDimension(page: Page, axis: "W" | "H" | "D", value: string) {
  const field = page.locator(".lr-dimension-cards").getByRole("spinbutton", { name: `${axis} mm`, exact: true });
  await field.fill(value);
  await field.blur();
  await expect(field).toHaveValue(value);
}

async function setObjectPosition(page: Page, axis: "X" | "Z", value: string) {
  const field = page.locator(".lr-inspector-scroll").getByRole("spinbutton", { name: `${axis} mm`, exact: true });
  await field.fill(value);
  await field.blur();
  await expect(field).toHaveValue(value);
}

async function placeTwoSeparatedCabinets(page: Page) {
  await placeCatalogCabinet(page);
  await expect(page.locator("[data-object-id]")).toHaveCount(1);
  await setObjectDimension(page, "W", "900");
  await setObjectPosition(page, "X", "-1800");
  await placeCatalogCabinet(page);
  await expect(page.locator("[data-object-id]")).toHaveCount(2);
  await setObjectDimension(page, "W", "900");
}

async function createCabinetRun(page: Page) {
  const objects = page.locator("[data-object-id]");
  await objects.nth(0).click();
  await objects.nth(1).click({ modifiers: ["Shift"] });
  await page.getByRole("button", { name: "Create cabinet run", exact: true }).click();
  await expect(page.locator(".lr-cabinet-run-inspector")).toBeVisible();
}

test("I2 enables auto fillers on a cabinet run", async ({ page }) => {
  await openDesignPlan(page);
  await placeTwoSeparatedCabinets(page);
  await createCabinetRun(page);

  const runInspector = page.locator(".lr-cabinet-run-inspector");
  const gap = runInspector.getByRole("spinbutton", { name: "Gap mm", exact: true });
  await gap.fill("80");
  await gap.blur();
  await runInspector.getByLabel("Auto fillers (40–150 mm)").check();
  await expect(runInspector.getByText(/1 filler on this run\./)).toBeVisible();
  await expect(page.locator(".lr-filler-symbol")).toHaveCount(1);
  await runInspector.getByLabel("Auto fillers (40–150 mm)").uncheck();
  await expect(page.locator(".lr-filler-symbol")).toHaveCount(0);

  await page.getByRole("button", { name: "2 · Build in 2D", exact: true }).click();
  await page.locator(".lr-build-history").getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
  await expect(page.locator(".lr-filler-symbol")).toHaveCount(1);
});

test("I2 places a corner wardrobe and supports undo", async ({ page }) => {
  await openDesignPlan(page);
  const cornerWardrobe = page.locator(".lr-asset-grid").getByRole("button", { name: /Corner Wardrobe.*Place/ });
  await expect(cornerWardrobe).toBeVisible();
  await cornerWardrobe.click();
  await expect(page.locator(".lr-corner-symbol")).toHaveCount(1);
  await expect(page.locator(".lr-inspector .lr-object-identity strong")).toHaveText("Corner Wardrobe");

  await page.getByRole("button", { name: "2 · Build in 2D", exact: true }).click();
  await page.locator(".lr-build-history").getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
  await expect(page.locator(".lr-corner-symbol")).toHaveCount(0);
});
