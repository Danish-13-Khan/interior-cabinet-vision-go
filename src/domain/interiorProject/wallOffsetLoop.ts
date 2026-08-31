import { createWallSegment } from "./wallEditingSegment";
import { MIN_SEGMENT_MM } from "./wallEditingHelpers";
import { polygonSelfIntersects, polygonSignedArea, roomPlanPolygon } from "./roomGeometry";
import type { InteriorProject, Point2Mm } from "./types";

const MIN_OFFSET_MM = 50;
const MAX_OFFSET_MM = 4000;
const MIN_OFFSET_AREA = 10_000;

function intersectInfinite(a: Point2Mm, b: Point2Mm, c: Point2Mm, d: Point2Mm): Point2Mm | null {
  const denom = (a.x - b.x) * (c.z - d.z) - (a.z - b.z) * (c.x - d.x);
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((a.x - c.x) * (c.z - d.z) - (a.z - c.z) * (c.x - d.x)) / denom;
  return { x: a.x + t * (b.x - a.x), z: a.z + t * (b.z - a.z) };
}

function offsetLoopPoints(points: Point2Mm[], offsetMm: number): Point2Mm[] | null {
  const area = polygonSignedArea(points);
  if (Math.abs(area) < 1) return null;
  const distance = Math.max(MIN_OFFSET_MM, Math.min(MAX_OFFSET_MM, Math.round(Math.abs(offsetMm))));
  const sign = (offsetMm < 0 ? -1 : 1) * Math.sign(area);
  const lines: { a: Point2Mm; b: Point2Mm }[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const start = points[index]!;
    const end = points[(index + 1) % points.length]!;
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dz);
    if (length < MIN_SEGMENT_MM) return null;
    const nx = (-dz / length) * sign;
    const nz = (dx / length) * sign;
    lines.push({
      a: { x: start.x + nx * distance, z: start.z + nz * distance },
      b: { x: end.x + nx * distance, z: end.z + nz * distance },
    });
  }
  const result: Point2Mm[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const previous = lines[(index + lines.length - 1) % lines.length]!;
    const current = lines[index]!;
    const hit = intersectInfinite(previous.a, previous.b, current.a, current.b);
    if (!hit) return null;
    result.push(hit);
  }
  return result;
}

/** Inset (positive) or outset (negative) the room loop as new partition walls. */
export function offsetPlanLoop(project: InteriorProject, roomId: string, offsetMm: number): InteriorProject {
  if (!Number.isFinite(offsetMm) || offsetMm === 0) return project;
  const polygon = roomPlanPolygon(project, roomId);
  if (!polygon) return project;
  const inner = offsetLoopPoints(polygon.outer, offsetMm);
  if (!inner) return project;
  const sourceArea = polygonSignedArea(polygon.outer);
  const innerArea = polygonSignedArea(inner);
  if (Math.sign(innerArea) !== Math.sign(sourceArea)
    || Math.abs(innerArea) < MIN_OFFSET_AREA
    || polygonSelfIntersects(inner)) return project;
  let next = project;
  for (let index = 0; index < inner.length; index += 1) {
    next = createWallSegment(next, {
      start: inner[index]!,
      end: inner[(index + 1) % inner.length]!,
      roomId,
      kind: "partition",
    });
  }
  return next;
}
