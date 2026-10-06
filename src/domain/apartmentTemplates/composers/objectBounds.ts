import type { InteriorObjectEntity } from "../../interiorProject";

export type ObjectBox = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };

/** Axis-aligned bounds of an object (plan rotations are multiples of 90°). */
export function objectBox(object: InteriorObjectEntity): ObjectBox {
  const quarter = Math.round(((((object.rotation?.y ?? 0) % 180) + 180) % 180) / 90) === 1;
  const across = quarter ? object.dimensions.depthMm : object.dimensions.widthMm;
  const deep = quarter ? object.dimensions.widthMm : object.dimensions.depthMm;
  const { x, y, z } = object.position;
  return {
    minX: x - across / 2, maxX: x + across / 2,
    minY: y, maxY: y + object.dimensions.heightMm,
    minZ: z - deep / 2, maxZ: z + deep / 2,
  };
}

/** True when two objects' bounds intersect by more than `toleranceMm` on every axis (touching is fine). */
export function objectsCollide(a: InteriorObjectEntity, b: InteriorObjectEntity, toleranceMm = 1): boolean {
  const p = objectBox(a);
  const q = objectBox(b);
  return Math.min(p.maxX, q.maxX) - Math.max(p.minX, q.minX) > toleranceMm
    && Math.min(p.maxY, q.maxY) - Math.max(p.minY, q.minY) > toleranceMm
    && Math.min(p.maxZ, q.maxZ) - Math.max(p.minZ, q.minZ) > toleranceMm;
}
