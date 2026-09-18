import { BoxGeometry, CylinderGeometry, ExtrudeGeometry, Path, Shape, type BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { CompiledPrimitive } from "../../domain/livingRoom";
import { applyBoxSurfaceUvs } from "../../rendering/materials/boxSurfaceUvs";

const geometryCache = new Map<string, { geometry: BufferGeometry; users: number }>();

function polygonGeometry(primitive: Extract<CompiledPrimitive, { kind: "polygon-prism" }>) {
  const shape = new Shape();
  primitive.outlineMm.forEach((point, index) => {
    const x = point.x / 1000; const y = point.z / 1000;
    if (index === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  });
  shape.closePath();
  for (const hole of primitive.holesMm) {
    const path = new Path();
    hole.forEach((point, index) => {
      const x = point.x / 1000; const y = point.z / 1000;
      if (index === 0) path.moveTo(x, y); else path.lineTo(x, y);
    });
    path.closePath(); shape.holes.push(path);
  }
  const depth = primitive.heightMm / 1000;
  const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function createCompiledGeometry(primitive: CompiledPrimitive) {
  const geometry = primitive.kind === "polygon-prism"
    ? polygonGeometry(primitive)
    : primitive.kind === "box"
    ? new BoxGeometry(
        primitive.sizeMm.width / 1000,
        primitive.sizeMm.height / 1000,
        primitive.sizeMm.depth / 1000,
      )
    : primitive.kind === "rounded-box"
      ? new RoundedBoxGeometry(
          primitive.sizeMm.width / 1000,
          primitive.sizeMm.height / 1000,
          primitive.sizeMm.depth / 1000,
          primitive.smoothness,
          primitive.radiusMm / 1000,
        )
      : new CylinderGeometry(
        primitive.radiusTopMm / 1000,
        primitive.radiusBottomMm / 1000,
        primitive.heightMm / 1000,
        primitive.radialSegments,
      );
  if (primitive.kind === "box" || primitive.kind === "rounded-box") {
    applyBoxSurfaceUvs(geometry, primitive.sizeMm);
  }
  return geometry;
}

/** Acquire only after mounting; abandoned React renders must not retain geometry. */
export function acquireCompiledGeometry(primitive: CompiledPrimitive) {
  const key = primitive.geometryKey;
  let entry = geometryCache.get(key);
  if (!entry) {
    entry = { geometry: createCompiledGeometry(primitive), users: 0 };
    geometryCache.set(key, entry);
  }
  entry.users += 1;
  const acquired = entry;
  let released = false;
  return {
    geometry: acquired.geometry,
    release() {
      if (released) return;
      released = true;
      acquired.users -= 1;
      if (acquired.users === 0) {
        geometryCache.delete(key);
        acquired.geometry.dispose();
      }
    },
  };
}

export function compiledGeometryCacheSize() {
  return geometryCache.size;
}
