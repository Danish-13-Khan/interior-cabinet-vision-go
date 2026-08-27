import { orderedLoopPoints, polygonBounds, roomPlanPolygon, roomPolygonIsValid } from "./roomGeometry";
import type { InteriorProject, SurfaceZoneEntity } from "./types";

const GENERATED_BY = "closed-room-loop";

function materialFor(project: InteriorProject, roomId: string, kind: "floor" | "ceiling") {
  const room = project.rooms.find((item) => item.id === roomId);
  const key = kind === "floor" ? "floorMaterialId" : "ceilingMaterialId";
  const value = room?.extensions?.[key];
  return typeof value === "string" ? value : null;
}

function generatedSurface(
  project: InteriorProject,
  roomId: string,
  kind: "floor" | "ceiling",
): SurfaceZoneEntity | null {
  const room = project.rooms.find((item) => item.id === roomId);
  if (!room?.outerLoopId) return null;
  const polygon = orderedLoopPoints(project, room.outerLoopId);
  if (polygon.length < 3) return null;
  const existing = project.surfaces.find((surface) =>
    surface.roomId === roomId && surface.kind === kind
    && (surface.loopId === room.outerLoopId || surface.extensions?.generatedBy === GENERATED_BY));
  return {
    id: existing?.id ?? `${roomId}:${kind}`,
    kind,
    roomId,
    loopId: room.outerLoopId,
    polygon,
    materialId: existing?.materialId ?? materialFor(project, roomId, kind),
    extensions: { ...existing?.extensions, generatedBy: GENERATED_BY },
  };
}

/** Keep canonical floor/ceiling zones synchronized with every valid closed room loop. */
export function synchronizeRoomSurfaceZones(project: InteriorProject): InteriorProject {
  const rooms = project.rooms.map((room) => {
    const polygon = roomPlanPolygon(project, room.id);
    if (!polygon || !roomPolygonIsValid(polygon)) return room;
    const bounds = polygonBounds(polygon.outer);
    return { ...room, dimensions: {
      ...room.dimensions, widthMm: bounds.widthMm, depthMm: bounds.depthMm,
    } };
  });
  const derived = { ...project, rooms };
  const generatedIds = new Set(rooms.flatMap((room) => [`${room.id}:floor`, `${room.id}:ceiling`]));
  const retained = derived.surfaces.filter((surface) =>
    surface.extensions?.generatedBy !== GENERATED_BY && !generatedIds.has(surface.id));
  const generated = rooms.flatMap((room) => {
    const polygon = roomPlanPolygon(derived, room.id);
    if (!polygon || !roomPolygonIsValid(polygon)) return [];
    return [generatedSurface(derived, room.id, "floor"), generatedSurface(derived, room.id, "ceiling")]
      .filter((surface): surface is SurfaceZoneEntity => Boolean(surface));
  });
  return { ...derived, surfaces: [...retained, ...generated] };
}
