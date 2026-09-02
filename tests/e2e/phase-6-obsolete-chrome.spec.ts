import { expect, test } from "@playwright/test";
import { loadGoldenCabinetRun, openInteriorsHome } from "./plannerStart";

test("Phase 6 hides obsolete Interiors chrome and keeps Golden as QA coverage", async ({ page }) => {
  await openInteriorsHome(page);
  const home = page.getByTestId("interiors-projects-home");
  await expect(home).toBeVisible();
  await expect(home.getByRole("button", { name: /Golden Run/i })).toHaveCount(0);
  await expect(home.getByRole("button", { name: /Release Demo/i })).toHaveCount(0);
  await expect(page.locator(".planner-v2-steps")).toHaveCount(0);

  await loadGoldenCabinetRun(page);
  await expect(page.getByTestId("interiors-project-crumb")).toContainText("Golden Cabinet Run");
  await expect(page.locator(".planner-v2-steps")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Schedule CSV", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Production", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Review + export" })).toHaveCount(0);
  await expect(page.locator(".lr-inspector-empty")).toHaveCount(0);
  await expect(page.getByTestId("interiors-present")).toBeVisible();

  await page.getByTestId("interiors-present").click();
  await expect(page.getByTestId("interiors-present-titlebar")).toContainText("Present and Send");
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  await expect(page.getByTestId("interiors-present-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Schedule CSV" })).toHaveCount(0);
  await expect(page.locator(".lr-render-studio")).toHaveCount(0);

  await page.getByTestId("interiors-present-capture").click();
  await expect(page.getByTestId("interiors-client-capture")).toBeVisible();
  await expect(page.getByRole("button", { name: "Render Image" })).toBeVisible();
  await expect(page.locator(".lr-render-studio")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Live Preview" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Result" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Draft Preview" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "High Quality" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Still review" })).toHaveCount(0);
  await expect(page.getByLabel("Render settings")).toHaveCount(0);
  await expect(page.getByLabel("Saved project cameras")).toHaveCount(0);
  await expect(page.getByLabel("Package camera deck")).toHaveCount(0);
  await expect(page.getByLabel("Presentation tier honesty")).toHaveCount(0);
});
