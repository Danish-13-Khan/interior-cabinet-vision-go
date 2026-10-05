import { expect, test, type Page } from "@playwright/test";
import { createShellPlan } from "./plannerStart";
import { dragWallBetween } from "./roadmap-exit-journey.helpers";

async function openPlan(page: Page) {
  await createShellPlan(page);
}

test("H1 splits a room with Draw Wall, renames, switches, and shows both faces in 3D", async ({ page }) => {
  await openPlan(page);
  await page.locator('[data-build-tool="draw-wall"]').click();
  // Back wall to front wall through the room centre; both ends land on walls, which splits it.
  await dragWallBetween(page, "lr-wall-back", "lr-wall-front");

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

  await page.getByRole("button", { name: "2D plan", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Room plan");
  // Switch + rename also push history, so undo until the split itself is gone.
  for (let step = 0; step < 8; step += 1) {
    if ((await switcher.getByRole("tab").count()) === 1) break;
    await page.getByRole("button", { name: "Undo", exact: true }).click();
  }
  await expect(switcher.getByRole("tab")).toHaveCount(1);
});
