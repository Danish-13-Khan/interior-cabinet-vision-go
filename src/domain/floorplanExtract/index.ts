export { floorplanApiBase } from "./config";
export {
  extractFloorplan,
  exportFloorplanGlb,
  patchFloorplanGeometry,
  floorplanReady,
  ingestExtractionJson,
  type ExtractQuery,
  type PatchOp,
  type PolygonGroup,
  type LiveSchemaStatus,
  type ExtractionIngest,
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
export {
  summarizeFloorplanApplyImpact,
  buildFloorplanApplySnapshot,
  shellTopologyFingerprint,
  replacementImpactFingerprint,
  discardedContentFingerprint,
  applyImpactKey,
  type ApplyImpactFinding,
  type FloorplanApplySnapshot,
} from "./applyImpact";
export { ensureCollisionFreeIds } from "./ids";
export { normalizeExtraction, type NormalizeOptions } from "./normalize";
export { applyFloorplanToInterior } from "./applyToInterior";
export {
  goldenKitchenExtraction,
  GOLDEN_KITCHEN_DXF_LINES_MM,
} from "./goldenKitchenExtract";
export { parseDxfLineEntities, undirectedSegmentKey } from "./dxfLineEntities";
export {
  classifyPlanUpload,
  planImportMismatchMessage,
  PLAN_UNDERLAY_ACCEPT,
  IMPORT_WALLS_ACCEPT,
} from "./planImportKind";
export { OPENING_END_TOL_M, MIN_WALL_THICK_M, M_TO_MM } from "./meters";
export type {
  ExtractionResult,
  NormalizedFloorplan,
  NormalizeIssue,
} from "./types";
export { coerceExtractionToMeters, rescaleExtractionCoords } from "./units";
export { assertExtractionShape } from "./validateExtract";
