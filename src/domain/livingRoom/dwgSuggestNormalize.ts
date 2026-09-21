import type { Point2Mm } from "../interiorProject";
import { clipSegmentToBox } from "./dwgSuggestClip";
import type { DwgSuggestPlanRegion } from "./dwgSuggestSelection";

export type DwgSuggestCenterline = { a: Point2Mm; b: Point2Mm; layer: string };

export const DWG_SUGGEST_JOIN_MM = 0.5;
export const DWG_SUGGEST_MIN_LEN_MM = 1;

export function clipPlanSegmentToRegion(
  a: Point2Mm,
  b: Point2Mm,
  region: DwgSuggestPlanRegion,
): { a: Point2Mm; b: Point2Mm } | null {
  const clipped = clipSegmentToBox(
    { x: a.x, y: a.z },
    { x: b.x, y: b.z },
    { minX: region.minX, maxX: region.maxX, minY: region.minZ, maxY: region.maxZ },
  );
  if (!clipped) return null;
  return {
    a: { x: clipped.a.x, z: clipped.a.y },
    b: { x: clipped.b.x, z: clipped.b.y },
  };
}

function snapPoint(point: Point2Mm, eps: number): Point2Mm {
  return {
    x: Math.round(point.x / eps) * eps,
    z: Math.round(point.z / eps) * eps,
  };
}

function pointKey(point: Point2Mm) {
  return `${point.x}:${point.z}`;
}

function undirectedKey(a: Point2Mm, b: Point2Mm) {
  const ka = pointKey(a);
  const kb = pointKey(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}

function collinear(a: Point2Mm, b: Point2Mm, c: Point2Mm, eps: number) {
  const dx1 = b.x - a.x;
  const dz1 = b.z - a.z;
  const dx2 = c.x - b.x;
  const dz2 = c.z - b.z;
  return Math.abs(dx1 * dz2 - dz1 * dx2) <= eps * (Math.hypot(dx1, dz1) + Math.hypot(dx2, dz2));
}

function otherEnd(segment: DwgSuggestCenterline, node: Point2Mm): Point2Mm {
  return pointKey(segment.a) === pointKey(node) ? segment.b : segment.a;
}

function addIndex(at: Map<string, number[]>, point: Point2Mm, index: number) {
  const key = pointKey(point);
  const list = at.get(key);
  if (list) list.push(index);
  else at.set(key, [index]);
}

function mergeCollinear(segments: DwgSuggestCenterline[], eps: number): DwgSuggestCenterline[] {
  const active = [...segments];
  let merged = true;
  while (merged) {
    merged = false;
    const at = new Map<string, number[]>();
    active.forEach((segment, index) => {
      addIndex(at, segment.a, index);
      addIndex(at, segment.b, index);
    });
    for (const [key, indexes] of at) {
      if (indexes.length !== 2) continue;
      const [i, j] = indexes as [number, number];
      const left = active[i]!;
      const right = active[j]!;
      const node = pointKey(left.a) === key ? left.a : left.b;
      const start = otherEnd(left, node);
      const end = otherEnd(right, node);
      if (!collinear(start, node, end, eps)) continue;
      active[i] = { a: start, b: end, layer: left.layer };
      active.splice(j, 1);
      merged = true;
      break;
    }
  }
  return active;
}

/** Weld near endpoints, drop duplicates and stubs, join collinear 2-degree runs. */
export function normalizeDwgSuggestSegments(
  segments: DwgSuggestCenterline[],
  epsMm = DWG_SUGGEST_JOIN_MM,
): DwgSuggestCenterline[] {
  const unique: DwgSuggestCenterline[] = [];
  const seen = new Set<string>();
  for (const segment of segments) {
    const a = snapPoint(segment.a, epsMm);
    const b = snapPoint(segment.b, epsMm);
    if (Math.hypot(b.x - a.x, b.z - a.z) < DWG_SUGGEST_MIN_LEN_MM) continue;
    const key = undirectedKey(a, b);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ a, b, layer: segment.layer });
  }
  return mergeCollinear(unique, epsMm);
}
