import { expect, test, type Locator, type Page } from "@playwright/test";

async function openPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: "Create a room", exact: true }).click();
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

test("H2 drags a wall node and translates a wall with undo", async ({ page }) => {
  await openPlan(page);
  await page.locator('[data-build-tool="select"]').click();

  const node = page.locator("[data-node-id]").first();
  await expect(node).toBeVisible();
  const before = await node.getAttribute("data-node-id");
  await dragHandle(page, node, 48, 36);
  await expect(page.locator(`[data-node-id="${before}"]`)).toBeVisible();

  const wall = page.locator("[data-wall-id].is-active").first();
  await expect(wall).toHaveCount(1);
  await dragHandle(page, wall, 0, 60);

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-node-id]").first()).toBeVisible();
});
