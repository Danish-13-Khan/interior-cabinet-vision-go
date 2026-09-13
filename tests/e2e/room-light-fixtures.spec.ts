import { expect, test } from "@playwright/test";
import { loadReleaseDemo, openInteriorsHome } from "./plannerStart";

test("room lights can be added, adjusted and removed from the normal 3D workspace", async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openInteriorsHome(page);
  await loadReleaseDemo(page);
  await page.getByRole("button", { name: "3D", exact: true }).click();
  const guide = page.getByRole("button", { name: "Start exploring" });
  if (await guide.isVisible()) await guide.click();
  await page.getByRole("button", { name: "Room lights", exact: true }).click();
  const panel = page.getByRole("region", { name: "Room light fixtures" });
  await panel.getByRole("button", { name: "Under-cabinet LED strip", exact: true }).click();
  await panel.getByLabel("Strip length (mm)").fill("1800");
  await panel.getByLabel("Height (mm)").fill("1450");
  await panel.getByLabel("Brightness", { exact: true }).fill("8");
  await expect(panel.getByLabel("Strip length (mm)")).toHaveValue("1800");
  await panel.getByLabel("Light on").uncheck();
  await expect(panel.getByLabel("Light on")).not.toBeChecked();
  await panel.getByLabel("Light on").check();
  await page.screenshot({ path: test.info().outputPath("room-light-controls.png") });
  await panel.getByRole("button", { name: "Remove Under-cabinet LED strip" }).click();
  await expect(panel.getByLabel("Strip length (mm)")).toHaveCount(0);
  expect(errors).toEqual([]);
});
