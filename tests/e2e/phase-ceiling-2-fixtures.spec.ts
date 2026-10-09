import { expect, test, type Page } from "@playwright/test";
import { waitForRecoveryAutosave } from "./phase-7-hardening.helpers";
import { clickInteriorsTool, createBlankPlanForReopen, drawRectangleRoom } from "./plannerStart";

async function planPoint(page: Page, x: number, z: number) {
  return page.locator('svg[aria-label="Living room plan editor"]').evaluate((svg, point) => {
    const matrix = (svg as SVGSVGElement).getScreenCTM();
    if (!matrix) throw new Error("Plan SVG has no screen matrix");
    const screen = new DOMPoint(point.x, point.z).matrixTransform(matrix);
    return { x: screen.x, y: screen.y };
  }, { x, z });
}

async function roomBoundsMm(page: Page) {
  return page.locator("[data-wall-id]").evaluateAll((lines) => {
    const xs = lines.flatMap((line) => [Number(line.getAttribute("x1")), Number(line.getAttribute("x2"))]);
    const zs = lines.flatMap((line) => [Number(line.getAttribute("y1")), Number(line.getAttribute("y2"))]);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
  });
}

async function dragWorld(page: Page, x0: number, z0: number, x1: number, z1: number) {
  const start = await planPoint(page, x0, z0);
  const end = await planPoint(page, x1, z1);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 6 });
  await page.mouse.up();
}

async function lightCentre(page: Page) {
  const glyph = page.locator("[data-light-id]").first();
  return glyph.evaluate((node) => {
    if (node.tagName === "circle") return { x: Number(node.getAttribute("cx")), z: Number(node.getAttribute("cy")) };
    const points = (node.getAttribute("points") ?? "").split(" ").map((pair) => pair.split(",").map(Number));
    return { x: points.reduce((sum, [x]) => sum + x!, 0) / points.length, z: points.reduce((sum, [, z]) => sum + z!, 0) / points.length };
  });
}

/**
 * Ceiling roadmap Phase 2 exit gate: a COB dropped into a 400 mm cutout sits at
 * its centre, Fit shrinks the cutout to 100 × 100, dragging the cutout moves the
 * fixture, a panel gets a 610 × 610 cutout, and the hosts survive a reopen.
 */
test("Phase 2: fixtures sit in ceiling cutouts and follow them", async ({ page }) => {
  test.setTimeout(120_000);
  await createBlankPlanForReopen(page);
  await drawRectangleRoom(page);
  await expect(page.locator("[data-wall-id]")).toHaveCount(4);
  const room = await roomBoundsMm(page);
  const w = room.maxX - room.minX;
  const d = room.maxZ - room.minZ;
  const at = (fx: number, fz: number) => [room.minX + w * fx, room.minZ + d * fz] as const;

  await clickInteriorsTool(page, "wall");
  await page.locator('[data-build-tool="draw-ceiling-cutout"]').click();
  await dragWorld(page, ...at(0.2, 0.2), ...at(0.4, 0.4));
  await dragWorld(page, ...at(0.6, 0.6), ...at(0.8, 0.8));
  await expect(page.locator("[data-ceiling-cutout-id]")).toHaveCount(2);
  await page.getByTestId("lr-plan-layers-panel").locator("summary").click();
  await page.getByTestId("lr-ceiling-layer-toggle").check();
  await clickInteriorsTool(page, "select");

  // COB centred in the first cutout; its glyph sits on the cutout's centre.
  await page.getByRole("button", { name: "Add COB downlight in cutout-1" }).click();
  await expect(page.locator("[data-light-id]")).toHaveCount(1);
  const [cx, cz] = at(0.3, 0.3);
  const before = await lightCentre(page);
  expect(Math.abs(before.x - cx)).toBeLessThanOrEqual(50);
  expect(Math.abs(before.z - cz)).toBeLessThanOrEqual(50);
  const row = page.locator('[data-ceiling-cutout-row="cutout-1"]');
  await expect(row).toContainText("COB downlight");

  // Fit the cutout to the 90 mm fixture: 100 × 100.
  await page.getByRole("button", { name: "Fit cutout-1 to COB downlight" }).click();
  await expect(row).toContainText("100 mm × 100 mm");

  // Drag the cutout (grab its rim, clear of the light glyph); the fixture follows.
  await dragWorld(page, cx + 40, cz + 40, cx + 40 + w * 0.2, cz + 40);
  const after = await lightCentre(page);
  expect(after.x - before.x).toBeGreaterThan(w * 0.15);
  expect(Math.abs(after.z - before.z)).toBeLessThanOrEqual(50);

  // A panel in the second cutout sizes it to the panel plus clearance.
  await page.getByRole("button", { name: "Add panel light in cutout-2" }).click();
  await expect(page.locator("[data-light-id]")).toHaveCount(2);
  await expect(page.locator('[data-ceiling-cutout-row="cutout-2"]')).toContainText("610 mm × 610 mm");

  await waitForRecoveryAutosave(page);
  await page.reload();
  await expect(page.getByTestId("interiors-projects-home")).toHaveCount(0);
  await expect(page.locator("[data-light-id]")).toHaveCount(2);
  await expect(page.locator('[data-ceiling-cutout-row="cutout-2"]')).toContainText("Panel light");
});
