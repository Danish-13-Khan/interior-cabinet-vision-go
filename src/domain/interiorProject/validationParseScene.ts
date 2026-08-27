import type {
  CameraEntity,
  InteriorRoomEntity,
  InteriorValidationIssue,
  LightEntity,
  MaterialEntity,
  PlanLoop,
  PlanNodeEntity,
  SurfaceZoneEntity,
  WallEntity,
} from "./types";
import {
  booleanValue,
  extensions,
  numberIn,
  parameterMap,
  point2,
  point3,
  records,
  rotation,
  text,
  uniqueId,
  type UnknownRecord,
} from "./validationHelpers";

export function parseMaterials(source: UnknownRecord, issues: InteriorValidationIssue[]) {
  const materialIds = new Set<string>();
  return records(source.materials).map((material, index) => {
    const kind = ["wood", "fabric", "metal", "glass", "paint", "stone", "laminate", "custom"].includes(String(material.kind))
      ? (material.kind as MaterialEntity["kind"])
      : "custom";
    return {
      id: uniqueId(material.id, `material-${index + 1}`, `materials[${index}].id`, materialIds, issues),
      name: text(material.name, `Material ${index + 1}`),
      kind,
      color: text(material.color, "#cccccc", 32),
      roughness: numberIn(material.roughness, 0.7, 0, 1),
      metalness: numberIn(material.metalness, 0, 0, 1),
      opacity: numberIn(material.opacity, 1, 0, 1),
      extensions: extensions(material.extensions),
    };
  });
}

export function parseLights(
  source: UnknownRecord,
  validRoomIds: Set<string>,
  issues: InteriorValidationIssue[],
) {
  const lightIds = new Set<string>();
  return records(source.lights).map((light, index) => {
    const kind = ["ambient", "directional", "point", "spot", "area"].includes(String(light.kind))
      ? (light.kind as LightEntity["kind"])
      : "point";
    const roomId = typeof light.roomId === "string" && validRoomIds.has(light.roomId) ? light.roomId : null;
    if (light.roomId != null && roomId == null) {
      issues.push({
        severity: "warning",
        code: "orphan-light",
        path: `lights[${index}].roomId`,
        message: "Detached a light from an unknown room.",
        repaired: true,
      });
    }
    return {
      id: uniqueId(light.id, `light-${index + 1}`, `lights[${index}].id`, lightIds, issues),
      roomId,
      name: text(light.name, `Light ${index + 1}`),
      kind,
      position: point3(light.position),
      rotation: rotation(light.rotation),
      color: text(light.color, "#ffffff", 32),
      intensity: numberIn(light.intensity, 1, 0, 100_000),
      enabled: booleanValue(light.enabled, true),
      parameters: parameterMap(light.parameters),
    };
  });
}

export function parseCameras(
  source: UnknownRecord,
  validRoomIds: Set<string>,
  issues: InteriorValidationIssue[],
) {
  const cameraIds = new Set<string>();
  return records(source.cameras)
    .map((camera, index): CameraEntity | null => {
      const roomId = text(camera.roomId, "", 120);
      if (!validRoomIds.has(roomId)) {
        issues.push({
          severity: "warning",
          code: "orphan-camera",
          path: `cameras[${index}].roomId`,
          message: "Removed a camera with an unknown room reference.",
          repaired: true,
        });
        return null;
      }
      return {
        id: uniqueId(camera.id, `camera-${index + 1}`, `cameras[${index}].id`, cameraIds, issues),
        roomId,
        name: text(camera.name, `Camera ${index + 1}`),
        position: point3(camera.position),
        target: point3(camera.target),
        fieldOfViewDegrees: numberIn(camera.fieldOfViewDegrees, 45, 10, 120),
        isDefault: booleanValue(camera.isDefault, index === 0),
      };
    })
    .filter((camera): camera is CameraEntity => Boolean(camera));
}

export function parseGraphAndSurfaces(
  source: UnknownRecord,
  validRoomIds: Set<string>,
  validWallIds: Set<string>,
  walls: WallEntity[],
  rooms: InteriorRoomEntity[],
  issues: InteriorValidationIssue[],
) {
  const nodeIds = new Set<string>();
  const nodes: PlanNodeEntity[] = records(source.nodes).map((node, index) => {
    const nodeExtensions = extensions(node.extensions);
    return {
      id: uniqueId(node.id, `node-${index + 1}`, `nodes[${index}].id`, nodeIds, issues),
      position: point2(node.position),
      ...(nodeExtensions ? { extensions: nodeExtensions } : {}),
    };
  });
  const validNodeIds = new Set(nodes.map((node) => node.id));
  for (const wall of walls) {
    if (wall.startNodeId && !validNodeIds.has(wall.startNodeId)) wall.startNodeId = undefined;
    if (wall.endNodeId && !validNodeIds.has(wall.endNodeId)) wall.endNodeId = undefined;
  }
  const loopIds = new Set<string>();
  const loops: PlanLoop[] = records(source.loops).map((loop, index) => ({
    id: uniqueId(loop.id, `loop-${index + 1}`, `loops[${index}].id`, loopIds, issues),
    wallUses: records(loop.wallUses)
      .filter((use) => validWallIds.has(String(use.wallId)))
      .map((use) => ({
        wallId: String(use.wallId),
        direction: use.direction === "reverse" ? "reverse" : "forward",
      })),
    extensions: extensions(loop.extensions),
  }));
  const validLoopIds = new Set(loops.map((loop) => loop.id));
  for (const room of rooms) {
    if (room.outerLoopId && !validLoopIds.has(room.outerLoopId)) room.outerLoopId = undefined;
    room.holeLoopIds = (room.holeLoopIds ?? []).filter((id) => validLoopIds.has(id));
  }
  const surfaceIds = new Set<string>();
  const surfaces: SurfaceZoneEntity[] = records(source.surfaces).map((surface, index) => ({
    id: uniqueId(surface.id, `surface-${index + 1}`, `surfaces[${index}].id`, surfaceIds, issues),
    kind: ["floor", "ceiling", "wall"].includes(String(surface.kind))
      ? surface.kind as SurfaceZoneEntity["kind"]
      : "floor",
    polygon: Array.isArray(surface.polygon) ? surface.polygon.map(point2) : null,
    roomId: validRoomIds.has(String(surface.roomId)) ? String(surface.roomId) : null,
    loopId: validLoopIds.has(String(surface.loopId)) ? String(surface.loopId) : null,
    materialId: typeof surface.materialId === "string" ? surface.materialId : null,
    extensions: extensions(surface.extensions),
  }));
  return { nodes, loops, surfaces };
}
