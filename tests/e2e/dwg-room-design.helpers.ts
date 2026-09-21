import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { clickInteriorsTool, createBlankPlan } from "./plannerStart";

export const roomDxf = readFileSync(new URL("../fixtures/dwg/room_4000x3000.dxf", import.meta.url));

export async function chooseCad(page: Page, name: string, buffer: Buffer) {
  await clickInteriorsTool(page, "import");
  await page.locator('input[type=file][accept*=".dwg"]').setInputFiles({
    name,
    mimeType: "application/octet-stream",
    buffer,
  });
}

export async function planPoint(page: Page, x: number, z: number) {
  return page.getByTestId("lr-plan-svg").evaluate((svg, point) => {
    const screen = new DOMPoint(point.x, point.z).matrixTransform((svg as SVGSVGElement).getScreenCTM()!);
    return { x: screen.x, y: screen.y };
  }, { x, z });
}

export function planWalls(page: Page) {
  return page.locator(".lr-plan-svg line[data-wall-id]");
}

export async function clickPlan(page: Page, x: number, z: number) {
  const screen = await planPoint(page, x, z);
  await page.mouse.click(screen.x, screen.y);
}

export async function importRoomDxf(page: Page) {
  await createBlankPlan(page);
  await chooseCad(page, "room_4000x3000.dxf", roomDxf);
  const dialog = page.getByTestId("lr-underlay-dwg-dialog");
  await expect(dialog.getByRole("button", { name: "Import tracing background" })).toBeEnabled({ timeout: 45_000 });
  return dialog;
}

export async function confirmCalibrateSouthWall(page: Page) {
  await page.getByTestId("lr-underlay-dwg-dialog").getByRole("button", { name: "Import tracing background" }).click();
  await expect(page.getByTestId("lr-underlay-dwg-dialog")).toHaveCount(0);
  await expect(page.getByTestId("lr-plan-underlay-image")).toBeVisible();
  await expect(page.locator(".lr-plan-svg.is-calibrate")).toBeVisible();
  await clickPlan(page, -2000, 1500);
  await clickPlan(page, 2000, 1500);
  await page.getByTestId("calibrate-known-length-input").fill("4000");
  await page.getByTestId("calibrate-known-length-confirm").click();
}

export async function saveInteriorProjectJson(page: Page) {
  const download = page.waitForEvent("download");
  await page.getByTestId("interiors-save-state").click();
  const file = await download;
  return JSON.parse(readFileSync((await file.path())!, "utf8")) as unknown;
}

export async function openInteriorProjectJson(page: Page, saved: unknown, name = "project.json") {
  await page.getByTestId("interiors-project-crumb").evaluate((button: HTMLButtonElement) => button.click());
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("dialog", { name: "Start a living room project" })
    .getByRole("button", { name: "Open project", exact: true }).click();
  await (await chooser).setFiles({
    name,
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved)),
  });
}
