import { BoxGeometry, CylinderGeometry, ExtrudeGeometry, Path, Shape, type BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { CompiledPrimitive } from "../../domain/livingRoom";

const geometryCache = new Map<string, BufferGeometry>();

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

/** Share immutable geometry by compiler key across repeated scene nodes. */
export function getCompiledGeometry(primitive: CompiledPrimitive) {
  const cached = geometryCache.get(primitive.geometryKey);
  if (cached) return cached;
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
  geometryCache.set(primitive.geometryKey, geometry);
  return geometry;
}

export function compiledGeometryCacheSize() {
  return geometryCache.size;
}
