import { expect, test, type Page } from "@playwright/test";

async function openPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: "Create a room", exact: true }).click();
}

test("H5 exposes active room and wall construction in the inspector", async ({ page }) => {
  await openPlan(page);
  await page.locator('[data-build-tool="select"]').click();
  const inspector = page.locator(".lr-inspector");
  const roomHeading = inspector.getByText("Room", { exact: true });
  await expect(roomHeading).toBeVisible();
  await inspector.locator(".lr-wall-inspector").evaluate((element) => element.scrollIntoView({ block: "center" }));
  await expect(inspector.getByLabel("Thickness")).toBeVisible();
  await expect(inspector.getByLabel("Height")).toHaveCount(2);
  const material = inspector.getByLabel("Wall material");
  await expect(material).toBeVisible();
  const originalMaterial = await material.inputValue();
  await material.selectOption("");
  await expect(material).toHaveValue("");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(material).toHaveValue(originalMaterial);
});
