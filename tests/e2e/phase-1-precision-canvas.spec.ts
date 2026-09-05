import { expect, test, type Page } from "@playwright/test";
import { createShellPlan } from "./plannerStart";

async function planPoint(page: Page, x: number, z: number) {
  return page.getByTestId("lr-plan-svg").evaluate((svg, point) => {
    const matrix = (svg as SVGSVGElement).getScreenCTM();
    if (!matrix) throw new Error("Plan SVG has no screen matrix");
    const screen = new DOMPoint(point.x, point.z).matrixTransform(matrix);
    return { x: screen.x, y: screen.y };
  }, { x, z });
}

test.describe("Phase 1 precision canvas", () => {
  test("exposes fit controls and measure tool on the plan", async ({ page }) => {
    await createShellPlan(page);
    await expect(page.getByTestId("lr-plan-canvas")).toBeVisible();
    await expect(page.getByTestId("lr-plan-svg")).toBeVisible();

    const fit = page.getByTestId("fit-plan").first();
    await expect(fit).toBeVisible();
    await fit.click();

    const measure = page.locator("[data-build-tool=measure]").first();
    if (await measure.isVisible().catch(() => false)) {
      await measure.click();
      await expect(page.locator(".lr-plan-svg.is-measure")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator(".lr-plan-svg.is-measure")).toHaveCount(0);
    } else {
      await expect(page.getByTestId("lr-plan-svg")).toHaveAttribute("viewBox", /.+/);
    }
  });

  test("measure click on opening does not start drag; marquee works from room floor", async ({ page }) => {
    test.setTimeout(60_000);
    await createShellPlan(page);
    await page.getByTestId("fit-plan").first().click();

    const opening = page.locator("[data-opening-id]").first();
    await expect(opening).toBeVisible();
    const openingId = await opening.getAttribute("data-opening-id");
    const offsetBefore = await opening.getAttribute("data-offset-mm");

    await page.locator("[data-build-tool=measure]").first().click();
    await expect(page.locator(".lr-plan-svg.is-measure")).toBeVisible();

    await opening.click({ force: true });
    await expect(page.getByTestId("lr-measure-point")).toHaveCount(1);
    await expect(page.locator(".lr-plan-svg.is-dragging")).toHaveCount(0);
    await expect(page.locator(`[data-opening-id="${openingId}"]`)).toHaveAttribute(
      "data-offset-mm",
      offsetBefore ?? "",
    );

    await page.keyboard.press("Escape");
    await page.locator("[data-build-tool=select]").first().click();

    const floor = page.locator("[data-room-floor]").first();
    await expect(floor).toBeVisible();
    const box = await floor.boundingBox();
    expect(box).toBeTruthy();
    const startX = box!.x + box!.width * 0.35;
    const startY = box!.y + box!.height * 0.35;
    const endX = startX + 120;
    const endY = startY + 90;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 8 });
    await expect(page.getByTestId("lr-plan-marquee")).toBeVisible();
    await page.mouse.up();
  });

  test("measure click via SVG CTM places point near known world coords", async ({ page }) => {
    test.setTimeout(60_000);
    await createShellPlan(page);
    await page.getByTestId("fit-plan").first().click();

    await page.locator("[data-build-tool=measure]").first().click();
    await expect(page.locator(".lr-plan-svg.is-measure")).toBeVisible();

    // Pick a world point from the live viewBox (center) so it is on-screen after fit.
    const world = await page.getByTestId("lr-plan-svg").evaluate((node) => {
      const svg = node as SVGSVGElement;
      const vb = svg.viewBox.baseVal;
      return { x: vb.x + vb.width * 0.42, z: vb.y + vb.height * 0.58 };
    });

    const screen = await planPoint(page, world.x, world.z);
    expect(Number.isFinite(screen.x)).toBe(true);
    expect(Number.isFinite(screen.y)).toBe(true);

    await page.mouse.click(screen.x, screen.y);

    const measurePoint = page.getByTestId("lr-measure-point").first();
    await expect(measurePoint).toBeVisible();
    const placed = await measurePoint.evaluate((el) => ({
      cx: Number((el as SVGCircleElement).getAttribute("cx")),
      cy: Number((el as SVGCircleElement).getAttribute("cy")),
    }));

    // Must fail if clientToPlan / CTM mapping regresses (wrong letterbox / scale).
    // Allow a modest window for semantic/grid snap around the intended world point.
    expect(Math.abs(placed.cx - world.x)).toBeLessThan(80);
    expect(Math.abs(placed.cy - world.z)).toBeLessThan(80);
  });

  test("secondary click in measure mode does not add a point", async ({ page }) => {
    await createShellPlan(page);
    await page.getByTestId("fit-plan").first().click();
    await page.locator("[data-build-tool=measure]").first().click();
    await expect(page.locator(".lr-plan-svg.is-measure")).toBeVisible();

    const floor = page.locator("[data-room-floor]").first();
    await expect(floor).toBeVisible();
    const box = await floor.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.click(box!.x + box!.width * 0.5, box!.y + box!.height * 0.5, { button: "right" });
    await expect(page.getByTestId("lr-measure-point")).toHaveCount(0);
  });
});
