/**
 * Proposal camera for a room without cut-list joinery (roadmap D2b): look at
 * the wall carrying the most placed objects (a bath at its vanity, a study at
 * its desk); an empty room is viewed along its long axis.
 */

import { roomPlanViewBounds, type InteriorProject, type Point3Mm } from "../interiorProject";
import type { RoomPlanViewBounds } from "../interiorProject/roomPlanBounds";
import type { CameraPoseMm } from "../livingRoom/cameraScreenBounds";
import { objectBox, type ObjectBox } from "./composers/objectBounds";
import { oppositeSide } from "./composers/helpers";
import type { WallSide } from "./types";

export const ROOM_FRAME = {
  eyeHeightMm: 1600,
  targetHeightMm: 1100,
  fovDegrees: 42,
  wallInsetMm: 500,
  /** An object this close to a wall sits on it. */
  wallGapMm: 150,
} as const;

export type RoomFrame = CameraPoseMm & {
  source: "room";
  partial: false;
  /** The wall the camera looks at. */
  side: WallSide;
};

const SIDES: readonly WallSide[] = ["north", "south", "east", "west"];

/** Span of an object along a wall when it sits against that wall, else 0. */
function spanOnSide(box: ObjectBox, side: WallSide, room: RoomPlanViewBounds): number {
  const gap = ROOM_FRAME.wallGapMm;
  const across = box.maxX - box.minX;
  const deep = box.maxZ - box.minZ;
  if (side === "north") return box.minZ - room.minZ <= gap ? across : 0;
  if (side === "south") return room.maxZ - box.maxZ <= gap ? across : 0;
  if (side === "west") return box.minX - room.minX <= gap ? deep : 0;
  return room.maxX - box.maxX <= gap ? deep : 0;
}

/**
 * The wall with the largest span of placed objects (cabinets and lights
 * excluded), or null when nothing sits on a wall.
 */
export function busiestSide(project: InteriorProject, roomId: string): WallSide | null {
  const room = roomPlanViewBounds(project, roomId);
  const spans: Record<WallSide, number> = { north: 0, south: 0, east: 0, west: 0 };
  for (const object of project.objects) {
    if (object.roomId !== roomId || object.kind === "cabinet" || object.kind === "lighting") continue;
    const box = objectBox(object);
    for (const side of SIDES) spans[side] += spanOnSide(box, side, room);
  }
  const best = SIDES.reduce((winner, side) => (spans[side] > spans[winner] ? side : winner), "north");
  return spans[best] > 0 ? best : null;
}

/** Midpoint of a wall side at the given height. */
function sideMidpoint(side: WallSide, room: RoomPlanViewBounds, y: number): Point3Mm {
  if (side === "north") return { x: room.centerX, y, z: room.minZ };
  if (side === "south") return { x: room.centerX, y, z: room.maxZ };
  if (side === "west") return { x: room.minX, y, z: room.centerZ };
  return { x: room.maxX, y, z: room.centerZ };
}

/** Eye on the far side of the room from the viewed wall, inset from that wall but never past the centre. */
function eyeOpposite(side: WallSide, room: RoomPlanViewBounds): Point3Mm {
  const inset = ROOM_FRAME.wallInsetMm;
  const opposite = sideMidpoint(oppositeSide(side), room, ROOM_FRAME.eyeHeightMm);
  if (side === "north") return { ...opposite, z: Math.max(opposite.z - inset, room.centerZ) };
  if (side === "south") return { ...opposite, z: Math.min(opposite.z + inset, room.centerZ) };
  if (side === "west") return { ...opposite, x: Math.max(opposite.x - inset, room.centerX) };
  return { ...opposite, x: Math.min(opposite.x + inset, room.centerX) };
}

/** Camera for a room with no joinery: the busiest wall, else down the long axis. */
export function frameRoomCamera(project: InteriorProject, roomId: string): RoomFrame {
  const room = roomPlanViewBounds(project, roomId);
  const side = busiestSide(project, roomId) ?? (room.widthMm >= room.depthMm ? "east" : "north");
  return {
    position: eyeOpposite(side, room),
    target: sideMidpoint(side, room, ROOM_FRAME.targetHeightMm),
    fieldOfViewDegrees: ROOM_FRAME.fovDegrees,
    source: "room",
    partial: false,
    side,
  };
}
