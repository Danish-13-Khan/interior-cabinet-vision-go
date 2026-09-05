import { expect, test } from "@playwright/test";
import { openInteriorsHome } from "./plannerStart";

test("Phase 1 Daylight Sofa opens a visible plan", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await openInteriorsHome(page);
  await page.getByTestId("interiors-phase1-bench-daylight-sofa").click();
  await expect(page.getByTestId("interiors-projects-home")).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByTestId("interiors-project-crumb")).toContainText("Daylight Sofa");
  await expect(page.locator(".lr-chrome-rail")).toBeVisible();
  await expect(page.locator(".lr-plan-svg .lr-plan-object").first()).toBeVisible({ timeout: 10_000 });
  expect(errors, errors.join("\n")).toEqual([]);
});
