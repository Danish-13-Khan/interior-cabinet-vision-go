import {
  orientWallForRoom,
  roomPlanViewBounds,
  selectRoomWalls,
  type InteriorProject,
  type WallEntity,
} from "../interiorProject";
import type { WallSide } from "./types";

const SIDE_TO_LEGACY: Record<WallSide, "back" | "front" | "left" | "right"> = {
  north: "back",
  south: "front",
  west: "left",
  east: "right",
};

/** Map north/south/east/west ↔ catalog shell back/front/left/right. */
export function legacyWallSide(side: WallSide) {
  return SIDE_TO_LEGACY[side];
}

export function wallSideFromLegacy(
  legacy: string | undefined,
): WallSide | null {
  if (legacy === "back") return "north";
  if (legacy === "front") return "south";
  if (legacy === "left") return "west";
  if (legacy === "right") return "east";
  return null;
}

/**
 * Wall on a room side: prefer catalog `wallSide` tags, else closest edge of
 * the room plan bounds (north = −Z).
 */
export function wallOnSide(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
): WallEntity | null {
  const walls = selectRoomWalls(project, roomId);
  const tagged = walls.find((wall) => {
    const tag = wall.extensions?.wallSide;
    return tag === SIDE_TO_LEGACY[side] || tag === side;
  });
  if (tagged) return orientWallForRoom(project, roomId, tagged);

  const bounds = roomPlanViewBounds(project, roomId);
  let best: WallEntity | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const stored of walls) {
    const wall = orientWallForRoom(project, roomId, stored);
    const midX = (wall.start.x + wall.end.x) / 2;
    const midZ = (wall.start.z + wall.end.z) / 2;
    const dx = Math.abs(wall.end.x - wall.start.x);
    const dz = Math.abs(wall.end.z - wall.start.z);
    const horizontal = dx >= dz;
    let score = Number.POSITIVE_INFINITY;
    if (side === "north" && horizontal) score = Math.abs(midZ - bounds.minZ);
    if (side === "south" && horizontal) score = Math.abs(midZ - bounds.maxZ);
    if (side === "west" && !horizontal) score = Math.abs(midX - bounds.minX);
    if (side === "east" && !horizontal) score = Math.abs(midX - bounds.maxX);
    if (score < bestScore) {
      bestScore = score;
      best = wall;
    }
  }
  return best;
}
