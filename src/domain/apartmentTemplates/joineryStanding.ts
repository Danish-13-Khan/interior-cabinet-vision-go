/**
 * Where a proposal camera may stand in a room with joinery, and which way it
 * faces: away from the walls the run backs onto, along the aisle between
 * parallel runs, or toward the room centre for a free-standing piece.
 */

import type { RoomPlanViewBounds } from "../interiorProject/roomPlanBounds";
import type { AabbMm } from "../livingRoom/sceneNodeBounds";
import type { WallSide } from "./types";

export type PlanPoint = { x: number; z: number };
export type PlanRect = { minX: number; maxX: number; minZ: number; maxZ: number };

export const STANDING = {
  /** Standing room kept from the walls, shrinking to the tight value where the run leaves no space. */
  wallInsetMm: 500,
  tightWallInsetMm: 150,
  /** A run this close to a wall backs onto it, when it covers this share of the wall. */
  backingGapMm: 150,
  backingShare: 0.3,
  /** The eye never stands closer than this to a cabinet. */
  clearanceMm: 300,
} as const;

const SIDES: readonly WallSide[] = ["north", "south", "east", "west"];
const NORMAL: Record<WallSide, PlanPoint> = {
  north: { x: 0, z: 1 }, south: { x: 0, z: -1 }, west: { x: 1, z: 0 }, east: { x: -1, z: 0 },
};

function gapToSide(box: AabbMm, side: WallSide, room: RoomPlanViewBounds): number {
  if (side === "north") return box.min.z - room.minZ;
  if (side === "south") return room.maxZ - box.max.z;
  if (side === "west") return box.min.x - room.minX;
  return room.maxX - box.max.x;
}

function extentAlongSide(box: AabbMm, side: WallSide): number {
  return side === "north" || side === "south" ? box.max.x - box.min.x : box.max.z - box.min.z;
}

/** Walls the run backs onto: cabinets touching the wall cover at least the backing share of it. */
export function backingSides(boxes: readonly AabbMm[], room: RoomPlanViewBounds): WallSide[] {
  return SIDES.filter((side) => {
    const length = side === "north" || side === "south" ? room.widthMm : room.depthMm;
    const covered = boxes
      .filter((box) => gapToSide(box, side, room) <= STANDING.backingGapMm)
      .reduce((sum, box) => sum + extentAlongSide(box, side), 0);
    return covered >= STANDING.backingShare * length;
  });
}

function boxCentre(box: AabbMm): PlanPoint {
  return { x: (box.min.x + box.max.x) / 2, z: (box.min.z + box.max.z) / 2 };
}

function unit(point: PlanPoint): PlanPoint {
  const length = Math.hypot(point.x, point.z);
  return length > 1e-6 ? { x: point.x / length, z: point.z / length } : { x: 0, z: 1 };
}

/** Where the eye may stand: the room inset from its walls, only by the tight inset where the full one leaves no floor past the run. */
export function standingRect(box: AabbMm, room: RoomPlanViewBounds): PlanRect {
  const full = STANDING.wallInsetMm;
  const tight = STANDING.tightWallInsetMm;
  const gap = STANDING.clearanceMm;
  return {
    minX: room.minX + (room.minX + full <= box.min.x - gap ? full : tight),
    maxX: room.maxX - (room.maxX - full >= box.max.x + gap ? full : tight),
    minZ: room.minZ + (room.minZ + full <= box.min.z - gap ? full : tight),
    maxZ: room.maxZ - (room.maxZ - full >= box.max.z + gap ? full : tight),
  };
}

const along = (point: PlanPoint, direction: PlanPoint) => point.x * direction.x + point.z * direction.z;

function corners(rect: PlanRect): PlanPoint[] {
  return [
    { x: rect.minX, z: rect.minZ }, { x: rect.maxX, z: rect.minZ },
    { x: rect.minX, z: rect.maxZ }, { x: rect.maxX, z: rect.maxZ },
  ];
}

/** Corners and edge midpoints of the standing rectangle: the aisle end of a galley is a midpoint. */
export function standingCandidates(rect: PlanRect): PlanPoint[] {
  const midX = (rect.minX + rect.maxX) / 2;
  const midZ = (rect.minZ + rect.maxZ) / 2;
  return [
    ...corners(rect),
    { x: midX, z: rect.minZ }, { x: midX, z: rect.maxZ }, { x: rect.minX, z: midZ }, { x: rect.maxX, z: midZ },
  ];
}

/** Free floor along a direction: from the cabinets' foremost corner to the far edge of the standing rectangle. */
function reach(boxes: readonly AabbMm[], rect: PlanRect, direction: PlanPoint): number {
  const foremost = Math.max(...boxes.flatMap((b) => corners({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z })).map((p) => along(p, direction)));
  return Math.max(...corners(rect).map((p) => along(p, direction))) - foremost;
}

/**
 * Unit view direction from the run toward the eye. Backing walls push it
 * inward; parallel runs cancel and the aisle axis wins, toward the end with
 * more floor; a free-standing piece is viewed from the room centre's side.
 */
export function inwardDirection(box: AabbMm, boxes: readonly AabbMm[], room: RoomPlanViewBounds, rect: PlanRect): PlanPoint {
  const backing = backingSides(boxes, room);
  const summed = backing.reduce((sum, side) => ({ x: sum.x + NORMAL[side].x, z: sum.z + NORMAL[side].z }), { x: 0, z: 0 });
  if (Math.hypot(summed.x, summed.z) > 1e-6) return unit(summed);
  if (backing.length) {
    const alongAisle = backing.includes("north") ? [{ x: 1, z: 0 }, { x: -1, z: 0 }] : [{ x: 0, z: 1 }, { x: 0, z: -1 }];
    return alongAisle.sort((a, b) => reach(boxes, rect, b) - reach(boxes, rect, a))[0]!;
  }
  const centre = boxCentre(box);
  return unit({ x: room.centerX - centre.x, z: room.centerZ - centre.z });
}

/**
 * Floor in front of the run: for each backing wall, from the front face of
 * the cabinets on it to the far standing edge; without a backing wall, the
 * reach along the view direction. Under half a metre, no photo can show the run.
 */
export function standingDepthMm(boxes: readonly AabbMm[], room: RoomPlanViewBounds, rect: PlanRect, direction: PlanPoint): number {
  const backing = backingSides(boxes, room);
  if (!backing.length) return reach(boxes, rect, direction);
  return Math.max(...backing.map((side) => {
    const onWall = boxes.filter((box) => gapToSide(box, side, room) <= STANDING.backingGapMm);
    if (side === "north") return rect.maxZ - Math.max(...onWall.map((b) => b.max.z));
    if (side === "south") return Math.min(...onWall.map((b) => b.min.z)) - rect.minZ;
    if (side === "west") return rect.maxX - Math.max(...onWall.map((b) => b.max.x));
    return Math.min(...onWall.map((b) => b.min.x)) - rect.minX;
  }));
}

/** True when the eye keeps its clearance from every cabinet in plan. */
export function clearOfJoinery(eye: PlanPoint, boxes: readonly AabbMm[]): boolean {
  const gap = STANDING.clearanceMm;
  return boxes.every((box) =>
    eye.x < box.min.x - gap || eye.x > box.max.x + gap || eye.z < box.min.z - gap || eye.z > box.max.z + gap);
}

export function insideRect(eye: PlanPoint, rect: PlanRect): boolean {
  return eye.x >= rect.minX && eye.x <= rect.maxX && eye.z >= rect.minZ && eye.z <= rect.maxZ;
}

/** The standing point the run faces: clear of every cabinet, farthest along the view direction, then farthest away. */
export function farStandingPoint(target: PlanPoint, boxes: readonly AabbMm[], direction: PlanPoint, rect: PlanRect): PlanPoint {
  const candidates = standingCandidates(rect);
  const ahead = (p: PlanPoint) => along({ x: p.x - target.x, z: p.z - target.z }, direction);
  const away = (p: PlanPoint) => Math.hypot(p.x - target.x, p.z - target.z);
  const free = candidates.filter((p) => clearOfJoinery(p, boxes));
  return (free.length ? free : candidates).sort((a, b) => ahead(b) - ahead(a) || away(b) - away(a))[0]!;
}
