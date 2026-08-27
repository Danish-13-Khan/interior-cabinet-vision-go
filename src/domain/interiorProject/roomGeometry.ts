import { directedWallEnd, isLoopContiguous } from "./planTopology";
import type { InteriorProject, Point2Mm } from "./types";

export type RoomPlanPolygon = {
  outer: Point2Mm[];
  holes: Point2Mm[][];
};

export function orderedLoopPoints(project: InteriorProject, loopId: string): Point2Mm[] {
  const loop = project.loops.find((item) => item.id === loopId);
  const walls = new Map(project.walls.map((wall) => [wall.id, wall]));
  const nodes = new Map(project.nodes.map((node) => [node.id, node]));
  if (!loop || !isLoopContiguous(loop, walls)) return [];
  return loop.wallUses.flatMap((use) => {
    const wall = walls.get(use.wallId);
    if (!wall) return [];
    const nodeId = directedWallEnd(wall, use.direction).fromNodeId;
    const point = nodeId ? nodes.get(nodeId)?.position : undefined;
    return point ? [{ ...point }] : [];
  });
}

export function roomPlanPolygon(project: InteriorProject, roomId: string): RoomPlanPolygon | null {
  const room = project.rooms.find((item) => item.id === roomId);
  if (!room?.outerLoopId) return null;
  const outer = orderedLoopPoints(project, room.outerLoopId);
  if (outer.length < 3) return null;
  const holes = (room.holeLoopIds ?? [])
    .map((loopId) => orderedLoopPoints(project, loopId))
    .filter((points) => points.length >= 3);
  return { outer, holes };
}

export function polygonBounds(points: Point2Mm[]) {
  const xs = points.map((point) => point.x);
  const zs = points.map((point) => point.z);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minZ = Math.min(...zs); const maxZ = Math.max(...zs);
  return { minX, maxX, minZ, maxZ, widthMm: maxX - minX, depthMm: maxZ - minZ };
}

export function polygonCentroid(points: Point2Mm[]): Point2Mm {
  let area2 = 0; let x = 0; let z = 0;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index]!; const b = points[(index + 1) % points.length]!;
    const cross = a.x * b.z - b.x * a.z;
    area2 += cross; x += (a.x + b.x) * cross; z += (a.z + b.z) * cross;
  }
  if (Math.abs(area2) < 1) {
    const bounds = polygonBounds(points);
    return { x: (bounds.minX + bounds.maxX) / 2, z: (bounds.minZ + bounds.maxZ) / 2 };
  }
  return { x: x / (3 * area2), z: z / (3 * area2) };
}

function pointOnSegment(point: Point2Mm, a: Point2Mm, b: Point2Mm) {
  const cross = (point.z - a.z) * (b.x - a.x) - (point.x - a.x) * (b.z - a.z);
  if (Math.abs(cross) > 0.01) return false;
  const dot = (point.x - a.x) * (b.x - a.x) + (point.z - a.z) * (b.z - a.z);
  return dot >= 0 && dot <= (b.x - a.x) ** 2 + (b.z - a.z) ** 2;
}

export function pointInPolygon(point: Point2Mm, polygon: Point2Mm[]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index]!; const b = polygon[previous]!;
    if (pointOnSegment(point, a, b)) return true;
    if ((a.z > point.z) !== (b.z > point.z)
      && point.x < ((b.x - a.x) * (point.z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

export function pointInRoomPolygon(point: Point2Mm, polygon: RoomPlanPolygon) {
  return pointInPolygon(point, polygon.outer)
    && !polygon.holes.some((hole) => pointInPolygon(point, hole));
}

export function polygonSignedArea(points: Point2Mm[]) {
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length]!;
    return area + point.x * next.z - next.x * point.z;
  }, 0) / 2;
}

function orientation(a: Point2Mm, b: Point2Mm, c: Point2Mm) {
  const value = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
  return Math.abs(value) < 0.01 ? 0 : Math.sign(value);
}

function segmentsIntersect(a: Point2Mm, b: Point2Mm, c: Point2Mm, d: Point2Mm) {
  const abC = orientation(a, b, c); const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a); const cdB = orientation(c, d, b);
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && pointOnSegment(c, a, b))
    || (abD === 0 && pointOnSegment(d, a, b))
    || (cdA === 0 && pointOnSegment(a, c, d))
    || (cdB === 0 && pointOnSegment(b, c, d));
}

export function polygonSelfIntersects(points: Point2Mm[]) {
  for (let a = 0; a < points.length; a += 1) {
    const a1 = points[a]!; const a2 = points[(a + 1) % points.length]!;
    for (let b = a + 1; b < points.length; b += 1) {
      if (Math.abs(a - b) <= 1 || (a === 0 && b === points.length - 1)) continue;
      const b1 = points[b]!; const b2 = points[(b + 1) % points.length]!;
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

export function polygonsIntersect(first: Point2Mm[], second: Point2Mm[]) {
  return first.some((start, index) => {
    const end = first[(index + 1) % first.length]!;
    return second.some((otherStart, otherIndex) =>
      segmentsIntersect(start, end, otherStart, second[(otherIndex + 1) % second.length]!));
  });
}

export function roomPolygonIsValid(polygon: RoomPlanPolygon) {
  if (Math.abs(polygonSignedArea(polygon.outer)) < 10_000
    || polygonSelfIntersects(polygon.outer)) return false;
  for (const [index, hole] of polygon.holes.entries()) {
    if (Math.abs(polygonSignedArea(hole)) < 10_000 || polygonSelfIntersects(hole)) return false;
    if (hole.some((point) => !pointInPolygon(point, polygon.outer))
      || polygonsIntersect(polygon.outer, hole)) return false;
    for (let other = index + 1; other < polygon.holes.length; other += 1) {
      const next = polygon.holes[other]!;
      if (polygonsIntersect(hole, next)
        || pointInPolygon(hole[0]!, next) || pointInPolygon(next[0]!, hole)) return false;
    }
  }
  return true;
}
