export {
  INTERIOR_PROJECT_FILE_FORMAT,
  INTERIOR_PROJECT_SCHEMA_VERSION,
  type CameraEntity,
  type EntityExtensions,
  type EntityId,
  type EulerDegrees,
  type InteriorObjectEntity,
  type InteriorObjectKind,
  type InteriorProject,
  type InteriorProjectFile,
  type InteriorRoomEntity,
  type InteriorUnits,
  type InteriorValidationIssue,
  type InteriorValidationResult,
  type LightEntity,
  type LightKind,
  type MaterialKind,
  type MaterialEntity,
  type OpeningEntity,
  type OpeningKind,
  type PlanNodeEntity,
  type PlanLoop,
  type DirectedWallUse,
  type SurfaceZoneEntity,
  type ParameterValue,
  type Point2Mm,
  type Point3Mm,
  type RenderSettings,
  type PackageCameraBookmark,
  type RenderQuality,
  type RenderComposition,
  type RoomType,
  type Size3Mm,
  type WallEntity,
} from "./types";
export { createEmptyInteriorProject, DEFAULT_RENDER_SETTINGS } from "./defaults";
export {
  DEFAULT_DOOR_HEIGHT_MM,
  DEFAULT_WALL_HEIGHT_MM,
  DEFAULT_WALL_THICKNESS_MM,
  DEFAULT_WINDOW_HEIGHT_MM,
  DEFAULT_WINDOW_SILL_MM,
  PLAN_TRACE_HEIGHT_MM,
  PROJECT_UNITS_LABEL,
  STANDARD_DOOR_HEIGHTS_MM,
  STANDARD_SILL_HEIGHTS_MM,
  STANDARD_WALL_HEIGHTS_MM,
  STANDARD_WALL_THICKNESSES_MM,
  STANDARD_WINDOW_HEIGHTS_MM,
  clampWallHeightMm,
  clampWallThicknessMm,
} from "./authoringStandards";
export { MAX_PROJECT_ENTITIES_PER_COLLECTION, validateInteriorProject } from "./validation";
export {
  migrateInteriorProjectDocument,
  type InteriorMigrationResult,
} from "./migrations";
export {
  cabinetProjectFromInteriorProject,
  interiorProjectFromCabinetProject,
} from "./cabinetAdapter";
export { emptyCabinetProjectFromInterior } from "./emptyCabinetCompat";
export { interiorProjectFileName, isDefaultCabinetJob } from "./cabinetAdapterIds";
export {
  diagnoseDocumentIdentity,
  diagnoseInteriorCabinets,
  type AdapterDiagnostic,
  type AdapterDiagnosticReport,
} from "../cabinetIdentity";
export {
  createInteriorProjectFile,
  loadInteriorProjectFile,
  MAX_INTERIOR_PROJECT_FILE_BYTES,
  assertInteriorProjectFileByteLimit,
  serializeInteriorProjectFile,
  type InteriorProjectMigrationSource,
  type LoadedInteriorProject,
} from "./fileFormat";
export {
  selectActiveInteriorRoom,
  selectObjectsByKind,
  selectRoomObjects,
  selectRoomOpenings,
  selectRoomWalls,
} from "./selectors";
export {
  buildContiguousWallUses,
  orientWallForRoom,
  selectOpeningsForRoom,
  selectWallsForRoom,
  wallLengthMm,
} from "./planTopology";
export {
  createInteriorTechnicalPlanSvg,
  type InteriorTechnicalPlanOptions,
} from "./interiorTechnicalPlan";
export { validatePlanTopology, ensureCompatPlanTopology } from "./planTopologyValidation";
export {
  WALL_GRAPH_DOMAIN_VERSION,
  migrateBoxRoomsToWallGraph,
} from "./boxRoomGraphMigration";
export {
  createWallGraphIndex,
  graphWallPoints,
  movePlanNode,
  synchronizeWallCaches,
  wallDegree,
  type WallGraphIndex,
} from "./wallGraph";
export {
  drawRoomFromPoints,
  normalizeRoomPolygon,
  rectanglePoints,
  type RoomDrawingKind,
  type RoomDrawingRequest,
} from "./roomDrawing";
export {
  centerPolygonAtOrigin,
  EMPTY_PLAN_SITE_BOUNDS,
  roomPlanViewBounds,
  type RoomPlanViewBounds,
} from "./roomPlanBounds";
export {
  orderedLoopPoints,
  pointInPolygon,
  pointInRoomPolygon,
  polygonBounds,
  polygonCentroid,
  polygonSelfIntersects,
  polygonSignedArea,
  polygonsIntersect,
  roomPlanPolygon,
  roomPolygonIsValid,
  type RoomPlanPolygon,
} from "./roomGeometry";
export { synchronizeRoomSurfaceZones } from "./roomSurfaces";
export { splitRoomByWall } from "./roomSplit";
export { renameInteriorRoom, setActiveInteriorRoom } from "./roomActivation";
export { deleteInteriorRoom, mergeInteriorRooms } from "./roomOperations";
export { resizeRoomPlanGeometry } from "./roomResize";
export {
  createSurfaceZone,
  deleteSurfaceZone,
  isGeneratedRoomSurface,
  setSurfaceZoneMaterial,
  surfaceZoneFitsRoom,
  type SurfaceZoneRequest,
} from "./surfaceEditing";
export {
  createWallSegment,
  createWallSegmentResult,
  deletePlanWall,
  joinPlanNodes,
  mergeCoincidentPlanNodes,
  movePlanNodeWithOpenings,
  offsetPlanLoop,
  offsetPlanWall,
  applyWallPlanPatch,
  setPlanWallAngle,
  setPlanWallLength,
  wallPlanAngleDeg,
  wallPlanMidpoint,
  type WallPlanPatch,
  setPlanWallHeight,
  setPlanWallThickness,
  setPlanWallsRaised,
  snapPlanPoint,
  splitPlanWall,
  splitPlanWallResult,
  translatePlanWall,
  type WallSegmentRequest,
} from "./wallEditing";
export {
  compileWallHeightMm,
  isWallRaised,
  outerLoopWallsRaised,
} from "./wallRaise";
