import { expect, test } from "@playwright/test";
import { createBlankPlan, pointOnPaper } from "./plannerStart";

async function openPlan(page: import("@playwright/test").Page) {
  await createBlankPlan(page);
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
  await expect(page.locator("[data-wall-id]")).toHaveCount(4);
  await expect(page.locator('[data-wall-id][data-raised="true"]')).toHaveCount(4);
  await expect(page.locator("[data-room-floor]")).toBeVisible();

  for (const [x, y] of [[0.4, 0.4], [0.65, 0.42], [0.52, 0.65]]) {
    const point = await pointOnPaper(paper, x, y);
    await page.mouse.click(point.x, point.y);
  }
  await expect(page.getByRole("button", { name: "Close polygon (3)", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Close polygon (3)", exact: true }).click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(7);
  await expect(page.locator('[data-wall-id][data-raised="true"]')).toHaveCount(7);
  await expect(page.locator("[data-room-floor]")).toBeVisible();

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(4);
});
