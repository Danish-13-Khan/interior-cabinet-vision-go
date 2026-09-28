/**
 * Per-cabinet wall analysis for run framing: which room side each cabinet backs
 * onto, and a run-length-weighted inward direction so the camera faces the
 * fronts of the longest runs instead of the corner of one union box.
 */

import type { AabbMm } from "./sceneNodeBounds";

export type RoomSide = "front" | "back" | "left" | "right";

/** Wall thickness plus a small service gap between the envelope and a cabinet back. */
export const RUN_WALL_TOLERANCE_MM = 450;

/** Unit normal pointing from each wall into the room (the direction its cabinets face). */
export const ROOM_SIDE_INWARD: Record<RoomSide, { x: number; z: number }> = {
  back: { x: 0, z: 1 },
  front: { x: 0, z: -1 },
  left: { x: 1, z: 0 },
  right: { x: -1, z: 0 },
};

function sideGaps(box: AabbMm, room: AabbMm): Record<RoomSide, number> {
  return {
    back: box.min.z - room.min.z,
    front: room.max.z - box.max.z,
    left: box.min.x - room.min.x,
    right: room.max.x - box.max.x,
  };
}

/** Nearest wall the cabinet stands against, or null for a free-standing island. */
export function cabinetWallSide(box: AabbMm, room: AabbMm): RoomSide | null {
  const gaps = sideGaps(box, room);
  let best: RoomSide | null = null;
  for (const side of Object.keys(gaps) as RoomSide[]) {
    if (gaps[side] >= RUN_WALL_TOLERANCE_MM) continue;
    if (!best || gaps[side] < gaps[best]) best = side;
  }
  return best;
}

function alongWallLength(box: AabbMm, side: RoomSide): number {
  return side === "back" || side === "front" ? box.max.x - box.min.x : box.max.z - box.min.z;
}

export type CabinetRunWalls = {
  sides: Set<RoomSide>;
  /** Unit XZ direction from the run into the room, or null when nothing backs onto a wall. */
  inward: { x: number; z: number } | null;
};

export function analyseCabinetRunWalls(boxes: readonly AabbMm[], room: AabbMm): CabinetRunWalls {
  const sides = new Set<RoomSide>();
  let x = 0;
  let z = 0;
  for (const box of boxes) {
    const side = cabinetWallSide(box, room);
    if (!side) continue;
    sides.add(side);
    const weight = alongWallLength(box, side);
    x += ROOM_SIDE_INWARD[side].x * weight;
    z += ROOM_SIDE_INWARD[side].z * weight;
  }
  const length = Math.hypot(x, z);
  return { sides, inward: length > 1e-6 ? { x: x / length, z: z / length } : null };
}
