import { expect, test } from "@playwright/test";

test("D4 closes a freeform room into a measured 2D floor that remains available in 3D", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: "Create a room", exact: true }).click();
  await page.getByRole("button", { name: /Draw Room/ }).click();

  const plan = page.locator(".lr-plan-svg");
  const box = await plan.boundingBox();
  if (!box) throw new Error("Plan canvas is not rendered");
  const points: Array<[number, number]> = [
    [0.15, 0.03], [0.65, 0.03], [0.65, 0.08],
    [0.4, 0.08], [0.4, 0.13], [0.15, 0.13],
  ];
  for (const [x, z] of points) {
    await page.mouse.click(box.x + box.width * x, box.y + box.height * z);
  }
  await expect(page.getByRole("button", { name: "Close polygon (6)" })).toBeEnabled();
  await page.getByRole("button", { name: "Close polygon (6)" }).click();

  const floor = page.locator('[data-room-floor="room-1"]');
  await expect(floor).toBeVisible();
  await expect(floor).toHaveAttribute("fill-rule", "evenodd");
  await expect(page.locator(".lr-plan-dimension-pairs")).toContainText("Overall");
  await expect(page.locator("[data-wall-length-id]")).toHaveCount(0);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
});
