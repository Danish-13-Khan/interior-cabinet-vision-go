import { normalizeRoomPolygon } from "./roomDrawing";
import { pointInPolygon, pointInRoomPolygon, polygonSelfIntersects, roomPlanPolygon } from "./roomGeometry";
import type { InteriorProject, Point2Mm, SurfaceZoneEntity } from "./types";

export type SurfaceZoneRequest = {
  points: Point2Mm[];
  materialId: string;
  roomId?: string;
};

export function isGeneratedRoomSurface(surface: SurfaceZoneEntity) {
  return surface.extensions?.generatedBy === "closed-room-loop";
}

export function surfaceZoneFitsRoom(
  project: InteriorProject,
  roomId: string,
  points: Point2Mm[],
) {
  const room = roomPlanPolygon(project, roomId);
  if (!room) return false;
  const samples = points.flatMap((point, index) => {
    const next = points[(index + 1) % points.length]!;
    return [point, { x: (point.x + next.x) / 2, z: (point.z + next.z) / 2 }];
  });
  if (!samples.every((point) => pointInRoomPolygon(point, room))) return false;
  return room.holes.every((hole) => !pointInPolygon(hole[0]!, points));
}

function nextSurfaceId(project: InteriorProject) {
  const used = new Set(project.surfaces.map((surface) => surface.id));
  let index = 1;
  while (used.has(`surface-zone-${index}`)) index += 1;
  return `surface-zone-${index}`;
}

/** Add a material-bearing floor zone without changing the room boundary loop. */
export function createSurfaceZone(
  project: InteriorProject,
  request: SurfaceZoneRequest,
): InteriorProject {
  const roomId = request.roomId ?? project.activeRoomId;
  const polygon = normalizeRoomPolygon(request.points);
  if (!polygon || polygonSelfIntersects(polygon)) return project;
  if (!project.materials.some((material) => material.id === request.materialId)) return project;
  if (!surfaceZoneFitsRoom(project, roomId, polygon)) return project;
  const zone: SurfaceZoneEntity = {
    id: nextSurfaceId(project), kind: "floor", polygon, roomId, loopId: null,
    materialId: request.materialId,
    extensions: { createdBy: "draw-surface", surfaceZone: true },
  };
  return { ...project, surfaces: [...project.surfaces, zone] };
}

export function setSurfaceZoneMaterial(
  project: InteriorProject,
  surfaceId: string,
  materialId: string,
) {
  if (!project.materials.some((material) => material.id === materialId)) return project;
  return { ...project, surfaces: project.surfaces.map((surface) =>
    surface.id === surfaceId && !isGeneratedRoomSurface(surface)
      ? { ...surface, materialId }
      : surface) };
}

export function deleteSurfaceZone(project: InteriorProject, surfaceId: string) {
  return { ...project, surfaces: project.surfaces.filter((surface) =>
    surface.id !== surfaceId || isGeneratedRoomSurface(surface)) };
}
