import { DEFAULT_FINISH_IMPORT_UV, type FinishImportDraft } from "./finishImportDraft";
import { findManufacturerFinish } from "./manufacturerCatalogueSeeds";
import { validateFinishDataUrl } from "./importedFinishValidate";

function assertOwnedMap(dataUrl: string, label: string) {
  const invalid = validateFinishDataUrl(dataUrl);
  if (invalid) throw new Error(invalid);
  if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
    throw new Error(`${label} must ship as project-owned image bytes, not live URLs.`);
  }
}

/** Stage a curated catalogue finish for M4 preview (bytes already in the seed). */
export function stageManufacturerFinish(finishId: string): FinishImportDraft {
  const match = findManufacturerFinish(finishId);
  if (!match) throw new Error("That catalogue finish is not available.");
  assertOwnedMap(match.finish.mapDataUrl, "Catalogue finishes");
  if (match.finish.normalMapDataUrl) assertOwnedMap(match.finish.normalMapDataUrl, "Normal maps");
  if (match.finish.roughnessMapDataUrl) assertOwnedMap(match.finish.roughnessMapDataUrl, "Roughness maps");
  return {
    fileName: match.finish.name,
    dataUrl: match.finish.mapDataUrl,
    ...DEFAULT_FINISH_IMPORT_UV,
    color: match.finish.color,
    kind: match.finish.kind,
    roughness: match.finish.roughness,
    createdBy: "manufacturer-catalogue",
    manufacturerId: match.catalogue.id,
    catalogueFinishId: match.finish.id,
    brand: match.finish.brand,
    productCode: match.finish.productCode,
    sheetWidthMm: match.finish.sheetWidthMm,
    sheetHeightMm: match.finish.sheetHeightMm,
    normalMapDataUrl: match.finish.normalMapDataUrl,
    roughnessMapDataUrl: match.finish.roughnessMapDataUrl,
  };
}
