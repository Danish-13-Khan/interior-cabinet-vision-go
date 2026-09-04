import type { Point2Mm, RoomPlanViewBounds } from "../interiorProject";
import {
  pointInPolygon,
  pointInRoomPolygon,
  polygonBounds,
  polygonCentroid,
  polygonsIntersect,
} from "../interiorProject";

export type RoomPolygon = { outer: Point2Mm[]; holes: Point2Mm[][] };

const STAGGER_STEP_MM = 150;

function axisAlignedCorners(center: Point2Mm, widthMm: number, depthMm: number): Point2Mm[] {
  const halfW = widthMm / 2;
  const halfD = depthMm / 2;
  return [
    { x: center.x - halfW, z: center.z - halfD },
    { x: center.x + halfW, z: center.z - halfD },
    { x: center.x + halfW, z: center.z + halfD },
    { x: center.x - halfW, z: center.z + halfD },
  ];
}

/** True when the axis-aligned footprint stays in usable floor (outer minus holes). */
export function browserFootprintFitsRoom(
  polygon: RoomPolygon,
  center: Point2Mm,
  widthMm: number,
  depthMm: number,
): boolean {
  const corners = axisAlignedCorners(center, widthMm, depthMm);
  if (!corners.every((point) => pointInRoomPolygon(point, polygon))) return false;
  if (polygonsIntersect(corners, polygon.outer)) return false;
  return polygon.holes.every((hole) =>
    !polygonsIntersect(corners, hole) && !pointInPolygon(hole[0]!, corners));
}

function staggerOffset(roomObjectCount: number): Point2Mm {
  return {
    x: (roomObjectCount % 4) * STAGGER_STEP_MM - 225,
    z: (roomObjectCount % 3) * STAGGER_STEP_MM - 150,
  };
}

/** Dimensional room shell when wall topology is not yet available. */
export function rectangleBoundsAsPolygon(bounds: RoomPlanViewBounds): RoomPolygon {
  return {
    outer: [
      { x: bounds.minX, z: bounds.minZ },
      { x: bounds.maxX, z: bounds.minZ },
      { x: bounds.maxX, z: bounds.maxZ },
      { x: bounds.minX, z: bounds.maxZ },
    ],
    holes: [],
  };
}

function* gridPoints(bounds: ReturnType<typeof polygonBounds>, step: number): Generator<Point2Mm> {
  for (let z = bounds.minZ + step / 2; z <= bounds.maxZ; z += step) {
    for (let x = bounds.minX + step / 2; x <= bounds.maxX; x += step) {
      yield { x, z };
    }
  }
}

function* coarseCandidates(polygon: RoomPolygon, roomObjectCount: number): Generator<Point2Mm> {
  const bounds = polygonBounds(polygon.outer);
  const aabbCenter = {
    x: (bounds.minX + bounds.maxX) / 2,
    z: (bounds.minZ + bounds.maxZ) / 2,
  };
  const centroid = polygonCentroid(polygon.outer);
  const stagger = staggerOffset(roomObjectCount);
  for (const seed of [centroid, aabbCenter]) {
    yield { x: seed.x + stagger.x, z: seed.z + stagger.z };
    yield seed;
  }
  const coarse = Math.max(200, Math.min(bounds.widthMm, bounds.depthMm) / 8);
  for (const point of gridPoints(bounds, coarse)) {
    yield { x: point.x + stagger.x * 0.25, z: point.z + stagger.z * 0.25 };
    yield point;
  }
}

function* fineFootprintCandidates(polygon: RoomPolygon): Generator<Point2Mm> {
  const bounds = polygonBounds(polygon.outer);
  const fine = Math.max(40, Math.min(bounds.widthMm, bounds.depthMm) / 40);
  yield* gridPoints(bounds, fine);
  const outer = polygon.outer;
  for (let index = 0; index < outer.length; index += 1) {
    const a = outer[(index - 1 + outer.length) % outer.length]!;
    const b = outer[index]!;
    const c = outer[(index + 1) % outer.length]!;
    yield { x: (a.x + b.x + c.x) / 3, z: (a.z + b.z + c.z) / 3 };
  }
}

/** Coarse then fine search — every returned point has a validated footprint. */
export function searchBrowserFootprintFit(
  polygon: RoomPolygon,
  widthMm: number,
  depthMm: number,
  roomObjectCount: number,
): Point2Mm | null {
  for (const candidate of coarseCandidates(polygon, roomObjectCount)) {
    if (browserFootprintFitsRoom(polygon, candidate, widthMm, depthMm)) return candidate;
  }
  for (const candidate of fineFootprintCandidates(polygon)) {
    if (browserFootprintFitsRoom(polygon, candidate, widthMm, depthMm)) return candidate;
  }
  return null;
}

/** Point-only interior probe for oversized items that cannot fit any bay. */
export function guaranteedInteriorPlanPoint(polygon: RoomPolygon): Point2Mm | null {
  for (const point of fineFootprintCandidates(polygon)) {
    if (pointInRoomPolygon(point, polygon)) return point;
  }
  return null;
}

/** Explicit oversized policy: AABB center if interior, else any interior point. */
export function oversizedBrowserFallbackPoint(polygon: RoomPolygon): Point2Mm | null {
  const bounds = polygonBounds(polygon.outer);
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    z: (bounds.minZ + bounds.maxZ) / 2,
  };
  if (pointInRoomPolygon(center, polygon)) return center;
  return guaranteedInteriorPlanPoint(polygon);
}
