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

function onLine(origin: Point2Mm, ux: number, uz: number, point: Point2Mm, eps: number) {
  return Math.abs((point.x - origin.x) * uz - (point.z - origin.z) * ux) <= eps;
}

function unionCollinear(segments: DwgSuggestCenterline[], eps: number): DwgSuggestCenterline[] {
  const used = segments.map(() => false);
  const out: DwgSuggestCenterline[] = [];
  for (let i = 0; i < segments.length; i += 1) {
    if (used[i]) continue;
    const seed = segments[i]!;
    const len = Math.hypot(seed.b.x - seed.a.x, seed.b.z - seed.a.z);
    const ux = (seed.b.x - seed.a.x) / len;
    const uz = (seed.b.z - seed.a.z) / len;
    const intervals: { t0: number; t1: number; layer: string }[] = [];
    for (let j = i; j < segments.length; j += 1) {
      if (used[j]) continue;
      const item = segments[j]!;
      const itemLen = Math.hypot(item.b.x - item.a.x, item.b.z - item.a.z);
      const vx = (item.b.x - item.a.x) / itemLen;
      const vz = (item.b.z - item.a.z) / itemLen;
      if (Math.abs(ux * vz - uz * vx) > 0.02) continue;
      if (!onLine(seed.a, ux, uz, item.a, eps) || !onLine(seed.a, ux, uz, item.b, eps)) continue;
      used[j] = true;
      const tA = (item.a.x - seed.a.x) * ux + (item.a.z - seed.a.z) * uz;
      const tB = (item.b.x - seed.a.x) * ux + (item.b.z - seed.a.z) * uz;
      intervals.push({ t0: Math.min(tA, tB), t1: Math.max(tA, tB), layer: item.layer });
    }
    intervals.sort((left, right) => left.t0 - right.t0);
    const merged: { t0: number; t1: number; layer: string }[] = [];
    for (const interval of intervals) {
      const last = merged[merged.length - 1];
      if (!last || interval.t0 > last.t1 + eps) merged.push({ ...interval });
      else last.t1 = Math.max(last.t1, interval.t1);
    }
    for (const interval of merged) {
      out.push({
        a: { x: seed.a.x + ux * interval.t0, z: seed.a.z + uz * interval.t0 },
        b: { x: seed.a.x + ux * interval.t1, z: seed.a.z + uz * interval.t1 },
        layer: interval.layer,
      });
    }
  }
  return out;
}

/** Weld near endpoints, drop duplicates and stubs, union overlapping collinear runs. */
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
  return unionCollinear(unique, epsMm);
}
