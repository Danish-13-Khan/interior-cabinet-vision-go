import type { Locator, Page } from "@playwright/test";

export async function openInteriorsHome(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
}

async function loadInteriorsFixture(page: Page, key: "openReleaseDemo" | "openGoldenRun") {
  const projects = page.getByRole("dialog", { name: "Start a living room project" });
  await projects.waitFor();
  await page.evaluate((method) => {
    window.dispatchEvent(new CustomEvent("interiors-qa-fixture", { detail: method }));
  }, key);
  await projects.waitFor({ state: "hidden" });
}

export async function loadReleaseDemo(page: Page) {
  await loadInteriorsFixture(page, "openReleaseDemo");
}

export async function loadGoldenCabinetRun(page: Page) {
  await loadInteriorsFixture(page, "openGoldenRun");
}

/** Empty canvas — designer draws the first room. */
export async function createBlankPlan(page: Page) {
  await openInteriorsHome(page);
  await page.getByRole("button", { name: "New cabinet job", exact: true }).click();
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
