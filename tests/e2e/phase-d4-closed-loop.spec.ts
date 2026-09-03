import { expect, test } from "@playwright/test";
import { createBlankPlan, pointOnPaper } from "./plannerStart";

test("D4 closes a freeform room into a measured 2D floor that remains available in 3D", async ({ page }) => {
  await createBlankPlan(page);
  await page.getByTestId("interiors-tool-room").click();

  const paper = page.getByRole("application", { name: "Living room plan editor" });
  const points: Array<[number, number]> = [
    [0.15, 0.2], [0.55, 0.2], [0.55, 0.45],
    [0.35, 0.45], [0.35, 0.55], [0.15, 0.55],
  ];
  for (const [x, z] of points) {
    const point = await pointOnPaper(paper, x, z);
    await page.mouse.click(point.x, point.y);
  }
  await expect(page.getByRole("button", { name: "Close polygon (6)" })).toBeEnabled();
  await page.getByRole("button", { name: "Close polygon (6)" }).click();

  const floor = page.locator("[data-room-floor]").first();
  await expect(floor).toBeVisible();
  await expect(floor).toHaveAttribute("fill-rule", "evenodd");
  await expect(page.locator(".lr-plan-dimension-pairs")).toContainText("Overall");
  await expect(page.locator("[data-wall-length-id]")).toHaveCount(0);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
});
