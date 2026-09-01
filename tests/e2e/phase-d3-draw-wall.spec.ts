import { expect, test, type Locator, type Page } from "@playwright/test";

async function openPlan(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem("cabinet-designer:3d-guide:j1", "dismissed");
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
}

async function pointOnPaper(paper: Locator, x: number, y: number) {
  const box = await paper.boundingBox();
  if (!box) throw new Error("Plan paper is not rendered");
  return { x: box.x + box.width * x, y: box.y + box.height * y };
}

async function armDrawWall(page: Page) {
  await page.locator('[data-build-tool="draw-wall"]').click();
}

async function pickModelEntity(page: Page, id: string) {
  await expect.poll(
    () => page.evaluate((pickId) => Boolean(window.__lrModelPickApi?.raycastHitsPickId(pickId)), id),
    { timeout: 15_000 },
  ).toBe(true);
  const point = await page.evaluate((pickId) => window.__lrModelPickApi!.screenPointForPickId(pickId), id);
  expect(point).toBeTruthy();
  await page.mouse.click(point!.x, point!.y);
}

test("D3 draws a wall segment and supports undo", async ({ page }) => {
  await openPlan(page);
  await armDrawWall(page);
  const paper = page.getByRole("application", { name: "Living room plan editor" });
  const initialCount = await page.locator("[data-wall-id]").count();

  const start = await pointOnPaper(paper, 0.35, 0.55);
  const end = await pointOnPaper(paper, 0.65, 0.55);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();

  await expect(page.locator("[data-wall-id]")).toHaveCount(initialCount + 1);
  const drawnWall = page.locator("[data-wall-id]").last();
  await expect(drawnWall).toHaveAttribute("data-raised", "true");
  const wallId = await drawnWall.getAttribute("data-wall-id");
  expect(wallId).toBeTruthy();
  await expect(page.locator(".lr-wall-drawing-overlay line")).toHaveCount(0);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await pickModelEntity(page, wallId!);
  await expect(page.locator(".inspector-header")).toContainText("Wall selected");

  await page.getByRole("button", { name: "2D", exact: true }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(initialCount);
});

test("D3 splits, deletes, edits thickness, and joins nodes on selected walls", async ({ page }) => {
  await openPlan(page);
  await armDrawWall(page);
  const paper = page.getByRole("application", { name: "Living room plan editor" });
  const initialCount = await page.locator("[data-wall-id]").count();

  const start = await pointOnPaper(paper, 0.35, 0.55);
  const end = await pointOnPaper(paper, 0.65, 0.55);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator("[data-wall-id]")).toHaveCount(initialCount + 1);

  const drawnWall = page.locator("[data-wall-id]").last();
  await expect(drawnWall).toHaveClass(/is-active/);

  await page.getByRole("button", { name: "Split at midpoint", exact: true }).click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(initialCount + 2);
  await expect(page.locator("[data-wall-id].is-active")).toHaveCount(1);

  const thickness = page.getByLabel("Wall thickness (mm)");
  await thickness.fill("180");
  await expect(thickness).toHaveValue("180");

  await page.getByRole("button", { name: "Delete wall", exact: true }).click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(initialCount + 1);

  await page.getByRole("button", { name: "Join coincident nodes", exact: true }).click();
  await expect(page.locator("[data-wall-id]")).toHaveCount(initialCount + 1);
});
