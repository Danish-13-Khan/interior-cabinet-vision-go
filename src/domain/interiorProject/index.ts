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
  type RenderQuality,
  type RenderComposition,
  type RoomType,
  type Size3Mm,
  type WallEntity,
} from "./types";
export { createEmptyInteriorProject, DEFAULT_RENDER_SETTINGS } from "./defaults";
export { MAX_PROJECT_ENTITIES_PER_COLLECTION, validateInteriorProject } from "./validation";
export {
  migrateInteriorProjectDocument,
  type InteriorMigrationResult,
} from "./migrations";
export {
  cabinetProjectFromInteriorProject,
  interiorProjectFromCabinetProject,
} from "./cabinetAdapter";
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
  setPlanWallThickness,
  snapPlanPoint,
  splitPlanWall,
  splitPlanWallResult,
  type WallSegmentRequest,
} from "./wallEditing";
