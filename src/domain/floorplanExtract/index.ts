export { floorplanApiBase } from "./config";
export {
  extractFloorplan,
  exportFloorplanGlb,
  patchFloorplanGeometry,
  floorplanReady,
  type ExtractQuery,
  type PatchOp,
} from "./client";
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
