import { BoxGeometry, CylinderGeometry, type BufferGeometry } from "three";
import type { CompiledPrimitive } from "../../domain/livingRoom";

const geometryCache = new Map<string, BufferGeometry>();

/** Share immutable geometry by compiler key across repeated scene nodes. */
export function getCompiledGeometry(primitive: CompiledPrimitive) {
  const cached = geometryCache.get(primitive.geometryKey);
  if (cached) return cached;
  const geometry = primitive.kind === "box"
    ? new BoxGeometry(
        primitive.sizeMm.width / 1000,
        primitive.sizeMm.height / 1000,
        primitive.sizeMm.depth / 1000,
      )
    : new CylinderGeometry(
        primitive.radiusTopMm / 1000,
        primitive.radiusBottomMm / 1000,
        primitive.heightMm / 1000,
        primitive.radialSegments,
      );
  geometryCache.set(primitive.geometryKey, geometry);
  return geometry;
}

export function compiledGeometryCacheSize() {
  return geometryCache.size;
}

