import { hydrateCabinetIdentities } from "../cabinetIdentity";
import { createEmptyInteriorProject } from "./defaults";
import { validatePlanTopology, ensureCompatPlanTopology } from "./planTopologyValidation";
import {
  INTERIOR_PROJECT_SCHEMA_VERSION,
  type InteriorProject,
  type InteriorValidationIssue,
  type InteriorValidationResult,
} from "./types";
import {
  extensions,
  isRecord,
  MAX_PROJECT_ENTITIES_PER_COLLECTION,
  noteTruncatedCollections,
  renderSettings,
  text,
} from "./validationHelpers";
import {
  parseObjects,
  parseOpenings,
  parseRooms,
  parseWalls,
} from "./validationParseShell";
import {
  parseCameras,
  parseGraphAndSurfaces,
  parseLights,
  parseMaterials,
} from "./validationParseScene";

export { MAX_PROJECT_ENTITIES_PER_COLLECTION };

export function validateInteriorProject(input: unknown): InteriorValidationResult {
  const issues: InteriorValidationIssue[] = [];
  const source = isRecord(input) ? input : {};
  if (!isRecord(input)) {
    issues.push({
      severity: "error",
      code: "invalid-root",
      path: "$",
      message: "Project root was not an object; defaults were applied.",
      repaired: true,
    });
  }
  noteTruncatedCollections(source, issues);
  const fallback = createEmptyInteriorProject();
  const { rooms, validRoomIds } = parseRooms(source, issues);
  const { walls, validWallIds, wallsById } = parseWalls(source, validRoomIds, issues);
  const openings = parseOpenings(source, validRoomIds, validWallIds, wallsById, issues);
  const objects = hydrateCabinetIdentities(
    parseObjects(source, validRoomIds, issues),
    issues,
  );
  const materials = parseMaterials(source, issues);
  const validMaterialIds = new Set(materials.map((material) => material.id));
  for (const wall of walls) {
    if (wall.materialId && !validMaterialIds.has(wall.materialId)) {
      issues.push({
        severity: "warning",
        code: "missing-material",
        path: `walls.${wall.id}.materialId`,
        message: "Removed an unknown wall material reference.",
        repaired: true,
      });
      wall.materialId = null;
    }
  }
  for (const object of objects) {
    object.materialSlots = Object.fromEntries(
      Object.entries(object.materialSlots).filter(([slot, materialId]) => {
        const valid = validMaterialIds.has(materialId);
        if (!valid) {
          issues.push({
            severity: "warning",
            code: "missing-material",
            path: `objects.${object.id}.materialSlots.${slot}`,
            message: "Removed an unknown object material reference.",
            repaired: true,
          });
        }
        return valid;
      }),
    );
  }
  const lights = parseLights(source, validRoomIds, issues);
  const cameras = parseCameras(source, validRoomIds, issues);
  const { nodes, loops, surfaces } = parseGraphAndSurfaces(
    source, validRoomIds, validWallIds, walls, rooms, issues,
  );
  const activeRoomId = validRoomIds.has(String(source.activeRoomId))
    ? String(source.activeRoomId)
    : rooms[0]?.id ?? "";
  const safeRenderSettings = renderSettings(source.renderSettings);
  const validCameraIds = new Set(cameras.map((camera) => camera.id));
  if (safeRenderSettings.activeCameraId && !validCameraIds.has(safeRenderSettings.activeCameraId)) {
    issues.push({
      severity: "warning",
      code: "missing-camera",
      path: "renderSettings.activeCameraId",
      message: "Cleared an unknown active camera reference.",
      repaired: true,
    });
    safeRenderSettings.activeCameraId = null;
  }
  safeRenderSettings.packageCameraBookmarks = safeRenderSettings.packageCameraBookmarks.filter(
    (bookmark) => validCameraIds.has(bookmark.cameraId),
  );
  const project: InteriorProject = {
    schemaVersion: INTERIOR_PROJECT_SCHEMA_VERSION,
    id: text(source.id, fallback.id, 120),
    name: text(source.name, fallback.name),
    units: "mm",
    createdAt: text(source.createdAt, fallback.createdAt, 40),
    updatedAt: text(source.updatedAt, fallback.updatedAt, 40),
    activeRoomId,
    nodes,
    loops,
    rooms,
    walls,
    openings,
    surfaces,
    objects,
    materials,
    lights,
    cameras,
    renderSettings: safeRenderSettings,
    extensions: extensions(source.extensions),
  };
  const withTopology = ensureCompatPlanTopology(project, issues);
  validatePlanTopology(withTopology, issues);
  return { project: withTopology, issues };
}
