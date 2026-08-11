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
  type MaterialEntity,
  type OpeningEntity,
  type Point2Mm,
  type Point3Mm,
  type RenderSettings,
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
