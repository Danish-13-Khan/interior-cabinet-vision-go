import { DEFAULT_FINISH_IMPORT_UV, type FinishImportDraft } from "./finishImportDraft";
import { findManufacturerFinish } from "./manufacturerCatalogueSeeds";
import { validateFinishDataUrl } from "./importedFinishValidate";

/** Stage a curated catalogue finish for M4 preview (bytes already in the seed). */
export function stageManufacturerFinish(finishId: string): FinishImportDraft {
  const match = findManufacturerFinish(finishId);
  if (!match) throw new Error("That catalogue finish is not available.");
  const invalid = validateFinishDataUrl(match.finish.mapDataUrl);
  if (invalid) throw new Error(invalid);
  if (match.finish.mapDataUrl.startsWith("http://") || match.finish.mapDataUrl.startsWith("https://")) {
    throw new Error("Catalogue finishes must ship as project-owned image bytes, not live URLs.");
  }
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
  };
}
