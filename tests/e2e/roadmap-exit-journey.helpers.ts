import { expect, type Locator, type Page } from "@playwright/test";

export async function pointOnPaper(paper: Locator, x: number, y: number) {
  const box = await paper.boundingBox();
  if (!box) throw new Error("Plan paper is not rendered");
  return { x: box.x + box.width * x, y: box.y + box.height * y };
}

export async function placeNewSingleDoor(page: Page) {
  const doors = page.locator("g[data-opening-id][data-catalog-item='opening:door-single']");
  const before = await doors.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-opening-id")));
  await page.locator('[aria-label="door catalog"] [data-catalog-item="opening:door-single"]').click();
  await page.getByRole("button", { name: /Place door on selected wall/ }).click();
  await expect(doors).toHaveCount(before.length + 1);
  const placedId = await doors.evaluateAll(
    (nodes, known) => nodes.map((node) => node.getAttribute("data-opening-id")).find((id) => id && !known.includes(id)) ?? "",
    before,
  );
  expect(placedId).toBeTruthy();
  await expect(page.locator(`g[data-opening-id="${placedId}"]`)).toBeVisible();
}

export async function longestRoomWallId(page: Page, roomId: string) {
  return page.locator(`[data-wall-id][data-room-id="${roomId}"]`).evaluateAll((lines) => {
    let best: { id: string; length: number } | null = null;
    for (const line of lines) {
      const id = line.getAttribute("data-wall-id");
      if (!id) continue;
      const length = Math.hypot(
        Number(line.getAttribute("x2")) - Number(line.getAttribute("x1")),
        Number(line.getAttribute("y2")) - Number(line.getAttribute("y1")),
      );
      if (!best || length > best.length) best = { id, length };
    }
    return best?.id ?? null;
  });
}

/** SVG lines can have a zero-height DOM box; click their transformed midpoint instead. */
export async function clickWallMidpoint(page: Page, wallId: string) {
  const point = await page.locator(`line[data-wall-id="${wallId}"]`).evaluate((node, expectedWallId) => {
    const line = node as SVGLineElement;
    const matrix = line.getScreenCTM();
    const svg = line.ownerSVGElement;
    if (!matrix || !svg) throw new Error(`Wall ${expectedWallId} is not rendered in an SVG`);
    const midpoint = svg.createSVGPoint();
    midpoint.x = (Number(line.getAttribute("x1")) + Number(line.getAttribute("x2"))) / 2;
    midpoint.y = (Number(line.getAttribute("y1")) + Number(line.getAttribute("y2"))) / 2;
    const client = midpoint.matrixTransform(matrix);
    return { x: client.x, y: client.y };
  }, wallId);
  await page.mouse.click(point.x, point.y);
}
