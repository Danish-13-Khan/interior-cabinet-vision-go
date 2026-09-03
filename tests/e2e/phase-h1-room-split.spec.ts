import { expect, test, type Locator, type Page } from "@playwright/test";

async function openPlan(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
}

async function pointOnPaper(paper: Locator, x: number, y: number) {
  const box = await paper.boundingBox();
  if (!box) throw new Error("Plan paper is not rendered");
  return { x: box.x + box.width * x, y: box.y + box.height * y };
}

/**
 * LivingRoomPlanView uses an 850mm margin around the active room.
 * Starter room is 6200×4600 → viewBox depth 6300. Mid-wall fractions:
 * back z=-2300 → 850/6300 ≈ 0.135; front z=2300 → 5450/6300 ≈ 0.865; x center = 0.5.
 */
test("H1 splits a room with Draw Wall, renames, switches, and shows both faces in 3D", async ({ page }) => {
  await openPlan(page);
  await page.locator('[data-build-tool="draw-wall"]').click();
  const paper = page.getByRole("application", { name: "Living room plan editor" });
  const start = await pointOnPaper(paper, 0.5, 850 / 6300);
  const end = await pointOnPaper(paper, 0.5, 5450 / 6300);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();

  const switcher = page.getByTestId("build-room-switcher");
  await expect(switcher.getByRole("tab")).toHaveCount(2);

  const created = switcher.getByRole("tab").nth(1);
  await created.click();
  const nameField = page.getByTestId("build-room-name");
  await nameField.fill("Studio");
  await nameField.blur();
  await expect(created).toHaveText("Studio");

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("3D model");
  await expect(page.getByRole("button", { name: "Dollhouse", exact: true })).toHaveClass(/is-active/);

  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Room plan");
  // Switch + rename also push history, so undo until the split itself is gone.
  for (let step = 0; step < 8; step += 1) {
    if ((await switcher.getByRole("tab").count()) === 1) break;
    await page.getByRole("button", { name: "Undo", exact: true }).click();
  }
  await expect(switcher.getByRole("tab")).toHaveCount(1);
});
