import { expect, test, type Locator, type Page } from "@playwright/test";

async function openPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: "Create a room", exact: true }).click();
}

async function pointOnPaper(paper: Locator, x: number, y: number) {
  const box = await paper.boundingBox();
  if (!box) throw new Error("Plan paper is not rendered");
  return { x: box.x + box.width * x, y: box.y + box.height * y };
}

test("D2 draws rectangle and closed polygon rooms through Build commands", async ({ page }) => {
  await openPlan(page);
  await page.locator('[data-build-tool="draw-room"]').click();
  const paper = page.getByRole("application", { name: "Living room plan editor" });

  const start = await pointOnPaper(paper, 0.65, 0.35);
  const end = await pointOnPaper(paper, 0.83, 0.57);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator("[data-wall-id]")).toHaveCount(8);
  await expect(page.locator("[data-wall-id]").first()).toBeVisible();

  for (const [x, y] of [[0.68, 0.35], [0.88, 0.38], [0.77, 0.6]]) {
    const point = await pointOnPaper(paper, x, y);
    await page.mouse.click(point.x, point.y);
  }
  await expect(page.getByRole("button", { name: "Close polygon (3)", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Close polygon (3)", exact: true }).click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(11);
  await expect(page.locator("[data-wall-id]").nth(4)).toBeVisible();

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(8);
});
