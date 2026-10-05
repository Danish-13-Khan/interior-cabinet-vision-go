import {
  roomPlanViewBounds,
  type InteriorProject,
  type OpeningEntity,
  type WallEntity,
} from "../interiorProject";

/** Test-only geometry helpers for apartment shells (world-space checks). */
export function roomIdByKey(project: InteriorProject): Map<string, string> {
  return new Map(project.rooms.map((room) => [
    String(room.extensions?.apartmentRoomKey ?? ""),
    room.id,
  ]));
}

export function roomAreaM2(project: InteriorProject, roomId: string): number {
  const bounds = roomPlanViewBounds(project, roomId);
  return (bounds.widthMm * bounds.depthMm) / 1e6;
}

function isHorizontal(wall: WallEntity): boolean {
  return Math.abs(wall.end.x - wall.start.x) >= Math.abs(wall.end.z - wall.start.z);
}

/**
 * Opening span in world space, measured along the wall from its fixed end
 * (lower x for east–west walls, lower z for north–south walls).
 */
export function openingWorldSpan(project: InteriorProject, opening: OpeningEntity) {
  const wall = project.walls.find((item) => item.id === opening.wallId)!;
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const horizontal = isHorizontal(wall);
  const at = (along: number) => horizontal
    ? wall.start.x + ux * along
    : wall.start.z + uz * along;
  const a = at(opening.offsetMm);
  const b = at(opening.offsetMm + opening.widthMm);
  const wallMin = horizontal
    ? Math.min(wall.start.x, wall.end.x)
    : Math.min(wall.start.z, wall.end.z);
  const lowNodeId = (horizontal ? wall.start.x < wall.end.x : wall.start.z < wall.end.z)
    ? wall.startNodeId
    : wall.endNodeId;
  const highNodeId = lowNodeId === wall.startNodeId ? wall.endNodeId : wall.startNodeId;
  return {
    wall,
    lengthMm: length,
    loMm: Math.min(a, b) - wallMin,
    hiMm: Math.max(a, b) - wallMin,
    worldLoMm: Math.min(a, b),
    worldHiMm: Math.max(a, b),
    lowNodeId,
    highNodeId,
  };
}

/** Half the thickest wall meeting `nodeId` perpendicular to `wall` (eats clear width). */
export function perpendicularHalfThickness(
  project: InteriorProject,
  wall: WallEntity,
  nodeId: string | null | undefined,
): number {
  if (!nodeId) return 0;
  const horizontal = isHorizontal(wall);
  return project.walls
    .filter((other) => other.id !== wall.id
      && (other.startNodeId === nodeId || other.endNodeId === nodeId)
      && isHorizontal(other) !== horizontal)
    .reduce((max, other) => Math.max(max, other.thicknessMm / 2), 0);
}
