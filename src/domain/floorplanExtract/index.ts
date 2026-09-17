export { floorplanApiBase } from "./config";
export {
  FLOORPLAN_GLB_EXPORT_PROFILE_VERSION,
  DEFAULT_FLOORPLAN_GLB_FLAGS,
  mergeFloorplanGlbFlags,
  floorplanGlbQuery,
  type FloorplanGlbExportFlags,
} from "./glbExportProfile";
export {
  hashFingerprintSeed,
  fingerprintFloorplanGlbRequest,
} from "./glbExportFingerprint";
export {
  FLOORPLAN_GLB_CACHE_LIMIT,
  getFloorplanGlb,
  peekFloorplanGlb,
  acquireFloorplanGlbObjectUrl,
  releaseFloorplanGlbObjectUrl,
  releaseFloorplanGlb,
  clearFloorplanGlbCache,
  floorplanGlbCacheSize,
  type FloorplanGlbHandle,
  type GetFloorplanGlbOptions,
} from "./glbExportCache";
export { assertGlbBlob } from "./glbMagic";

export {
  ingestExtractionJson, extractFloorplan, exportFloorplanGlb, patchFloorplanGeometry, floorplanReady,
  type ExtractQuery, type PolygonGroup, type PatchOp, type LiveSchemaStatus, type ExtractionIngest,
} from "./client";

export {
  summarizeFloorplanApplyImpact,
  buildFloorplanApplySnapshot,
  isFloorplanShellStaleSinceApply,
  floorplanShellStaleSinceApply,
  type FloorplanShellStaleReason,
  type FloorplanShellStaleState,
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
export { OPENING_END_TOL_M, MIN_WALL_THICK_M, M_TO_MM } from "./meters";
export type {
  ExtractionResult,
  NormalizedFloorplan,
  NormalizeIssue,
} from "./types";
export { coerceExtractionToMeters, rescaleExtractionCoords } from "./units";
export { assertExtractionShape } from "./validateExtract";

export {
  wrapSingleFloorBuilding,
  exportFloorplanBuilding,
  type MultiFloorLevel,
  type MultiFloorProject,
  type BuildingExportMode,
} from "./building";

export {
  fetchFloorplanSchema,
  validateExtractionAgainstLiveSchema,
  clearFloorplanSchemaCache,
} from "./schemaValidate";

export { reapplyFloorplanExtract } from "./reapplyFloorplanExtract";
