import { expect, test, type Locator, type Page } from "@playwright/test";

async function openDesignPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: "Create a room", exact: true }).click();
  await expect(page.locator('svg[aria-label="Living room plan editor"]')).toBeVisible();
  await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
  await expect(page.getByText("Millwork Design", { exact: true })).toBeVisible();
}

async function dragHandle(page: Page, handle: Locator, dx: number, dy: number) {
  const box = await handle.boundingBox();
  if (!box) throw new Error("Handle is not rendered");
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + dx, startY + dy, { steps: 8 });
  await page.mouse.up();
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

/**
 * Wall-attached catalog items land on the same wall center, so two placements stack.
 * Shrink and offset the first cabinet before placing the second.
 */
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
  const createRun = page.getByRole("button", { name: "Create cabinet run", exact: true });
  await expect(createRun).toBeEnabled();
  await createRun.click();
  await expect(page.locator(".lr-cabinet-run-inspector")).toBeVisible();
}

test("I1 creates and edits a wall-bound cabinet run with undo", async ({ page }) => {
  await openDesignPlan(page);
  await placeTwoSeparatedCabinets(page);
  await createCabinetRun(page);

  const runInspector = page.locator(".lr-cabinet-run-inspector");
  const gap = runInspector.getByRole("spinbutton", { name: "Gap mm", exact: true });
  await gap.fill("80");
  await gap.blur();
  await expect(gap).toHaveValue("80");
  await runInspector.getByLabel("Align").selectOption("end");
  await runInspector.getByLabel("Extend run across wall").check();
  await expect(runInspector.getByLabel("Extend run across wall")).toBeChecked();

  // V2 intentionally hides the legacy stage toolbar; history remains available in Build.
  await page.getByRole("button", { name: "2 · Build in 2D", exact: true }).click();
  await page.locator(".lr-build-history").getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
  await expect(runInspector.getByLabel("Extend run across wall")).not.toBeChecked();
});

test("I1 reflows a cabinet run after a bound wall endpoint moves", async ({ page }) => {
  await openDesignPlan(page);
  await placeTwoSeparatedCabinets(page);
  await createCabinetRun(page);

  const first = page.locator("[data-object-id]").first();
  const before = await first.getAttribute("transform");
  expect(before).toBeTruthy();

  await page.getByRole("button", { name: "2 · Build in 2D", exact: true }).click();
  await page.locator('[data-build-tool="select"]').click();
  // Wall geometry lines can extend beyond their stroke hit-area at browser zoom,
  // while the select-mode node handles are the supported wall-edit interaction.
  const node = page.locator("[data-node-id]").first();
  await expect(node).toBeVisible();
  await dragHandle(page, node, 0, 80);

  await expect(async () => {
    expect(await first.getAttribute("transform")).not.toBe(before);
  }).toPass();
});
