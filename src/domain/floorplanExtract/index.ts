export { floorplanApiBase } from "./config";
export {
  extractFloorplan,
  exportFloorplanGlb,
  patchFloorplanGeometry,
  floorplanReady,
  type ExtractQuery,
  type PatchOp,
  type PolygonGroup,
} from "./client";
export {
  fetchFloorplanSchema,
  validateExtractionAgainstLiveSchema,
  clearFloorplanSchemaCache,
} from "./schemaValidate";
export {
  wrapSingleFloorBuilding,
  exportFloorplanBuilding,
  type MultiFloorProject,
  type MultiFloorLevel,
  type BuildingExportMode,
} from "./building";
export { ensureCollisionFreeIds } from "./ids";
export { normalizeExtraction, type NormalizeOptions } from "./normalize";
export { applyFloorplanToInterior } from "./applyToInterior";
export { OPENING_END_TOL_M, MIN_WALL_THICK_M, M_TO_MM } from "./meters";
export type {
  ExtractionResult,
  NormalizedFloorplan,
  NormalizeIssue,
} from "./types";
export { coerceExtractionToMeters, rescaleExtractionCoords } from "./units";
export { assertExtractionShape } from "./validateExtract";
