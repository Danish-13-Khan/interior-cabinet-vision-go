import type { Point2Mm } from "../interiorProject";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

export type DwgSuggestPlanRegion = { minX: number; maxX: number; minZ: number; maxZ: number };

export function visibleDwgLayerNames(underlay: LivingRoomPlanUnderlay | null): string[] {
  if (!underlay?.dwg) return [];
  const hidden = new Set(underlay.dwg.hiddenLayers);
  return underlay.dwg.preview.layers.map((layer) => layer.name).filter((name) => !hidden.has(name));
}

export function defaultDwgSuggestLayerNames(underlay: LivingRoomPlanUnderlay | null): string[] {
  const visible = visibleDwgLayerNames(underlay);
  const walls = visible.filter((name) => /wall/i.test(name));
  if (walls.length) return walls;
  return visible.filter((name) => !/door|window|cabinet|note/i.test(name));
}

/** Named layers that are currently visible. Hidden names never survive, even if requested. */
export function resolveDwgSuggestLayerNames(
  underlay: LivingRoomPlanUnderlay | null,
  requested?: readonly string[] | null,
): string[] {
  const visible = new Set(visibleDwgLayerNames(underlay));
  const names = requested == null ? defaultDwgSuggestLayerNames(underlay) : [...requested];
  return names.filter((name) => visible.has(name));
}

export function normalizeDwgSuggestRegion(a: Point2Mm, b: Point2Mm): DwgSuggestPlanRegion | null {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minZ = Math.min(a.z, b.z);
  const maxZ = Math.max(a.z, b.z);
  if (!(maxX - minX >= 1) || !(maxZ - minZ >= 1)) return null;
  return { minX, maxX, minZ, maxZ };
}

export function dwgSuggestRegionContains(region: DwgSuggestPlanRegion, point: Point2Mm): boolean {
  return point.x >= region.minX && point.x <= region.maxX && point.z >= region.minZ && point.z <= region.maxZ;
}

/** Axis-aligned plan region vs segment, including segments that only cross the box. */
export function dwgSuggestSegmentHitsRegion(
  a: Point2Mm,
  b: Point2Mm,
  region: DwgSuggestPlanRegion,
): boolean {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  let t0 = 0;
  let t1 = 1;
  const clip = (p: number, q: number) => {
    if (Math.abs(p) < 1e-12) return q >= 0;
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
    return true;
  };
  return clip(-dx, a.x - region.minX)
    && clip(dx, region.maxX - a.x)
    && clip(-dz, a.z - region.minZ)
    && clip(dz, region.maxZ - a.z);
}
