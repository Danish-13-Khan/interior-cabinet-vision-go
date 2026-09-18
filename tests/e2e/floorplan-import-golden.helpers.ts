import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page } from "@playwright/test";
import { goldenKitchenExtraction } from "../../src/domain/floorplanExtract/goldenKitchenExtract";
import { rescaleExtractionCoords } from "../../src/domain/floorplanExtract/units";
import type { ExtractionResult, PatchOp } from "../../src/domain/floorplanExtract";

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), "../../fixtures/floorplanExtract/kitchen.dxf");
/** 8 m over 4000 drawing units → 0.002 m/unit, 2× the extract default 0.001. */
const CALIBRATE_M = "8";
const CALIBRATE_UNITS = "4000";
const EXPECT_PIXEL_SCALE = 0.002;

export function goldenKitchenDxfUpload() {
  return { name: "kitchen.dxf" as const, mimeType: "application/dxf", buffer: readFileSync(FIXTURE) };
}

type PatchBody = { extraction: ExtractionResult; ops?: PatchOp[] };

/** Sidecar is mocked; the DXF file is the real CAD payload Cabinet would POST. */
export async function mockGoldenKitchenExtract(page: Page) {
  const json = goldenKitchenExtraction();
  const scaleOps: PatchOp[] = [];
  await page.route("**/schema/v1", (route) => route.fulfill({
    json: { required: ["schema_version", "units", "polygons"], properties: { schema_version: { const: "1.0" } } },
  }));
  await page.route("**/extract*", (route) => route.fulfill({ json }));
  await page.route("**/geometry/patch*", async (route) => {
    const posted = route.request().postDataJSON() as PatchBody;
    const ops = posted.ops ?? [];
    scaleOps.push(...ops);
    const setScale = ops.find((op): op is Extract<PatchOp, { kind: "set_scale" }> => op.kind === "set_scale");
    if (!setScale || !posted.extraction) {
      await route.fulfill({ json: posted.extraction ?? json });
      return;
    }
    const prev = posted.extraction.pixel_scale ?? 0.001;
    const factor = setScale.rescale_coords ? setScale.pixel_scale / prev : 1;
    await route.fulfill({ json: rescaleExtractionCoords(posted.extraction, factor) });
  });
  return { scaleOps };
}

export async function applyGoldenKitchenImport(page: Page) {
  const mock = await mockGoldenKitchenExtract(page);
  await page.getByTestId("lr-import-walls-file").setInputFiles(goldenKitchenDxfUpload());
  const review = page.getByTestId("lr-floorplan-extract-review");
  await expect(review).toBeVisible();
  await page.getByTestId("lr-floorplan-ref-m").fill(CALIBRATE_M);
  await page.getByTestId("lr-floorplan-ref-px").fill(CALIBRATE_UNITS);
  await page.getByTestId("lr-floorplan-apply-ref").click();
  await expect(page.getByTestId("lr-floorplan-apply-ref")).toBeEnabled();
  const scale = mock.scaleOps.find((op): op is Extract<PatchOp, { kind: "set_scale" }> => op.kind === "set_scale");
  expect(scale).toMatchObject({ kind: "set_scale", pixel_scale: EXPECT_PIXEL_SCALE, rescale_coords: true });
  await page.getByTestId("lr-floorplan-scale-confirmed").check();
  const ack = page.getByTestId("lr-floorplan-replace-ack");
  if (await ack.isVisible()) await ack.check();
  await expect(page.getByTestId("lr-floorplan-extract-apply")).toBeEnabled();
  await page.getByTestId("lr-floorplan-extract-apply").click();
  await expect(review).toHaveCount(0);
  const imported = page.locator('[data-wall-id="wall-front"]');
  await expect(imported).toHaveCount(1);
  await expect(imported).toHaveAttribute("data-raised", "true");
  await expect(page.locator('[data-wall-id][data-raised="true"]')).toHaveCount(4);
  await imported.click({ force: true });
  const selected = page.getByRole("complementary", { name: "Selection properties" });
  await expect(selected.getByRole("strong").filter({ hasText: "Wall" })).toBeVisible();
  await expect(selected.getByRole("strong").filter({ hasText: "8000 mm" })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Thickness mm", exact: true })).toHaveValue("400");
  const fit = page.getByTestId("fit-plan").first();
  if (await fit.isVisible()) await fit.click();
}

export async function expectImportedWallsInModel(page: Page, wallId = "wall-front") {
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  await expect(page.locator(".lr-model-viewport canvas")).toBeVisible();
  await expect.poll(async () => page.evaluate((id) => {
    const point = window.__lrModelPickApi?.screenPointForPickId(id);
    return Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y));
  }, wallId), { timeout: 15_000 }).toBe(true);
}

export async function placeBaseCabinetOnImportedWall(page: Page, wallId = "wall-front") {
  await page.locator(`[data-wall-id="${wallId}"]`).click({ force: true });
  await page.getByTestId("interiors-workflow-area-cabinets").click();
  const place = page.locator(".lr-asset-grid").getByRole("button", { name: /Base Cabinet.*Place/ });
  await expect(place).toBeVisible();
  await place.click();
  await expect(page.locator("[data-object-id]").first()).toHaveAttribute("data-wall-id", wallId);
}
