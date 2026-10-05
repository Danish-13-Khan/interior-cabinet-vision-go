import {
  orientWallForRoom,
  roomPlanViewBounds,
  selectRoomWalls,
  type InteriorProject,
  type WallEntity,
} from "../interiorProject";
import { roomIdsUsingWall } from "../interiorProject/planTopology";
import { wallLength } from "../livingRoom/wallSegmentPlacement";
import type { WallSide } from "./types";

const SIDE_TO_LEGACY: Record<WallSide, "back" | "front" | "left" | "right"> = {
  north: "back",
  south: "front",
  west: "left",
  east: "right",
};

const EDGE_TOLERANCE_MM = 80;

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

function wallOnSideScore(
  wall: WallEntity,
  side: WallSide,
  bounds: ReturnType<typeof roomPlanViewBounds>,
): number {
  const midX = (wall.start.x + wall.end.x) / 2;
  const midZ = (wall.start.z + wall.end.z) / 2;
  const dx = Math.abs(wall.end.x - wall.start.x);
  const dz = Math.abs(wall.end.z - wall.start.z);
  const horizontal = dx >= dz;
  if (side === "north" && horizontal) return Math.abs(midZ - bounds.minZ);
  if (side === "south" && horizontal) return Math.abs(midZ - bounds.maxZ);
  if (side === "west" && !horizontal) return Math.abs(midX - bounds.minX);
  if (side === "east" && !horizontal) return Math.abs(midX - bounds.maxX);
  return Number.POSITIVE_INFINITY;
}

/** Orient so start is the fixed end (lower x, then lower z). */
export function orientWallFixedEnd(wall: WallEntity): WallEntity {
  const startLower =
    wall.start.x < wall.end.x - 0.5
    || (Math.abs(wall.start.x - wall.end.x) <= 0.5 && wall.start.z <= wall.end.z);
  if (startLower) return wall;
  return {
    ...wall,
    start: wall.end,
    end: wall.start,
    startNodeId: wall.endNodeId,
    endNodeId: wall.startNodeId,
  };
}

/**
 * All wall pieces on a room side, ordered along the side from the fixed end
 * (lower x for north/south, lower z for east/west).
 */
export function wallsOnSide(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
): WallEntity[] {
  const walls = selectRoomWalls(project, roomId);
  const bounds = roomPlanViewBounds(project, roomId);
  const tagged = walls.filter((wall) => {
    const tag = wall.extensions?.wallSide;
    return tag === SIDE_TO_LEGACY[side] || tag === side;
  });
  const source = tagged.length
    ? tagged
    : walls.filter((stored) => {
      const wall = orientWallForRoom(project, roomId, stored);
      return wallOnSideScore(wall, side, bounds) <= EDGE_TOLERANCE_MM;
    });
  const oriented = source.map((stored) =>
    orientWallFixedEnd(orientWallForRoom(project, roomId, stored)),
  );
  const horizontal = side === "north" || side === "south";
  return oriented.sort((a, b) => {
    const aKey = horizontal
      ? Math.min(a.start.x, a.end.x)
      : Math.min(a.start.z, a.end.z);
    const bKey = horizontal
      ? Math.min(b.start.x, b.end.x)
      : Math.min(b.start.z, b.end.z);
    return aKey - bKey;
  });
}

/** Longest piece on the side (compat helper for single-wall callers). */
export function wallOnSide(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
): WallEntity | null {
  const pieces = wallsOnSide(project, roomId, side);
  if (!pieces.length) return null;
  return [...pieces].sort((a, b) => wallLength(b) - wallLength(a))[0] ?? null;
}

/**
 * Exterior-only wall on a side (used by exactly one room). Throws when the
 * side has no exterior piece — shared walls must use between:[a,b] openings.
 */
export function exteriorWallOnSide(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
): WallEntity {
  const exterior = wallsOnSide(project, roomId, side).filter(
    (wall) => roomIdsUsingWall(project, wall.id).length === 1,
  );
  if (!exterior.length) {
    throw new Error(
      `No exterior wall on ${side} for room ${roomId} (shared walls need between:[a,b])`,
    );
  }
  return [...exterior].sort((a, b) => wallLength(b) - wallLength(a))[0]!;
}
