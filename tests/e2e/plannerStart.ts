import type { Locator, Page } from "@playwright/test";

export async function openInteriorsHome(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
}

/** Empty canvas — designer draws the first room. */
export async function createBlankPlan(page: Page) {
  await openInteriorsHome(page);
  await page.getByRole("button", { name: "Create a room", exact: true }).click();
}

/** Rectangular living-room shell with openings (wardrobe starter, no furniture besides cabinets). */
export async function createShellPlan(page: Page) {
  await openInteriorsHome(page);
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
}

export async function pointOnPaper(paper: Locator, x: number, y: number) {
  const box = await paper.boundingBox();
  if (!box) throw new Error("Plan paper is not rendered");
  return { x: box.x + box.width * x, y: box.y + box.height * y };
}

export async function drawRectangleRoom(page: Page, x0 = 0.28, y0 = 0.28, x1 = 0.72, y1 = 0.72) {
  await page.locator('[data-build-tool="draw-room"]').click();
  const paper = page.getByRole("application", { name: "Living room plan editor" });
  const start = await pointOnPaper(paper, x0, y0);
  const end = await pointOnPaper(paper, x1, y1);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
}
