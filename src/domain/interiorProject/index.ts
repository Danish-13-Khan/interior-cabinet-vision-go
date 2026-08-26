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
export { validateInteriorProject } from "./validation";
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
  selectOpeningsForRoom,
  selectWallsForRoom,
  wallLengthMm,
} from "./planTopology";
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
