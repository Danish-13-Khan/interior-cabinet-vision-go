import { isGeneratedRoomSurface, roomPlanPolygon, roomPolygonIsValid, selectRoomWalls, type InteriorProject, type InteriorRoomEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { createProceduralRenderBinding } from "./renderAssetBindings";
import { boxPrimitive, polygonPrismPrimitive } from "./scenePrimitives";
import type { CompiledSceneNode } from "./sceneTypes";

const FLOOR_FALLBACK = "compiled:floor-fallback";

function roomMaterial(project: InteriorProject, room: InteriorRoomEntity, kind: "floor" | "ceiling") {
  const surface = project.surfaces.find((item) => item.roomId === room.id && item.kind === kind
    && (item.loopId === room.outerLoopId || isGeneratedRoomSurface(item)));
  const extension = room.extensions?.[kind === "floor" ? "floorMaterialId" : "ceilingMaterialId"];
  return surface?.materialId ?? (typeof extension === "string" ? extension : null)
    ?? (kind === "floor" ? FLOOR_FALLBACK : LIVING_ROOM_MATERIAL_IDS.ceilingPaint);
}

export function compileRoomLoopSurfaces(
  project: InteriorProject,
  room: InteriorRoomEntity,
): CompiledSceneNode[] {
  const polygon = roomPlanPolygon(project, room.id);
  if (!polygon || !roomPolygonIsValid(polygon)) return [];
  const floorMaterial = roomMaterial(project, room, "floor");
  const ceilingMaterial = roomMaterial(project, room, "ceiling");
  const floor: CompiledSceneNode = {
    id: `room-floor:${room.id}`, name: `${room.name} Floor`, sourceObjectId: null,
    adapterId: "room-loop-floor-v2", positionMm: { x: 0, y: 0, z: 0 },
    rotationDegrees: { x: 0, y: 0, z: 0 },
    primitives: [polygonPrismPrimitive("floor", polygon.outer, polygon.holes, 12, -6, floorMaterial)],
    placeholder: false, metadata: { role: "floor", topology: "closed-loop" },
    renderBinding: createProceduralRenderBinding({ surface: floorMaterial }),
  };
  const ceiling: CompiledSceneNode = {
    id: `room-ceiling:${room.id}`, name: `${room.name} Ceiling`, sourceObjectId: null,
    adapterId: "room-loop-ceiling-v2", positionMm: { x: 0, y: 0, z: 0 },
    rotationDegrees: { x: 0, y: 0, z: 0 },
    primitives: [polygonPrismPrimitive("ceiling", polygon.outer, polygon.holes, 24, room.dimensions.heightMm + 12, ceilingMaterial)],
    placeholder: false, metadata: { role: "architecture", surface: "ceiling", topology: "closed-loop" },
    renderBinding: createProceduralRenderBinding({ surface: ceilingMaterial }),
  };
  return [floor, ceiling, compileLoopSkirting(project, room, ceilingMaterial),
    ...compileSurfaceZoneNodes(project, room)];
}

function compileSurfaceZoneNodes(project: InteriorProject, room: InteriorRoomEntity) {
  return project.surfaces.flatMap((surface): CompiledSceneNode[] => {
    if (surface.roomId !== room.id || isGeneratedRoomSurface(surface)) return [];
    if (!surface.polygon || surface.polygon.length < 3 || !surface.materialId) return [];
    return [{
      id: `surface-zone:${surface.id}`, name: `Surface zone ${surface.id}`,
      sourceObjectId: null, adapterId: "surface-zone-v1",
      positionMm: { x: 0, y: 0, z: 0 }, rotationDegrees: { x: 0, y: 0, z: 0 },
      primitives: [polygonPrismPrimitive(
        `surface:${surface.id}`, surface.polygon, [], 6, 3, surface.materialId,
      )],
      placeholder: false,
      metadata: { role: "surface", surfaceId: surface.id, surfaceKind: surface.kind },
      renderBinding: createProceduralRenderBinding({ surface: surface.materialId }),
    }];
  });
}

function compileLoopSkirting(
  project: InteriorProject,
  room: InteriorRoomEntity,
  materialId: string,
): CompiledSceneNode {
  const walls = selectRoomWalls(project, room.id).filter((wall) => {
    const loop = project.loops.find((item) => item.id === room.outerLoopId);
    return loop?.wallUses.some((use) => use.wallId === wall.id);
  });
  return {
    id: `room-skirting:${room.id}`, name: `${room.name} Skirting`, sourceObjectId: null,
    adapterId: "room-loop-skirting-v2", positionMm: { x: 0, y: 0, z: 0 },
    rotationDegrees: { x: 0, y: 0, z: 0 },
    primitives: walls.map((wall) => {
      const width = Math.max(1, Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z) - 20);
      return boxPrimitive(`skirting:${wall.id}`, { width, height: 90, depth: 18 }, {
        x: (wall.start.x + wall.end.x) / 2, y: 45, z: (wall.start.z + wall.end.z) / 2,
      }, materialId, { rotationDegrees: { x: 0, y: -Math.atan2(wall.end.z - wall.start.z, wall.end.x - wall.start.x) * 180 / Math.PI, z: 0 } });
    }),
    placeholder: false, metadata: { role: "architecture", surface: "skirting" },
    renderBinding: createProceduralRenderBinding({ surface: materialId }),
  };
}
