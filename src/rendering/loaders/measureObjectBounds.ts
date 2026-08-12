import { Box3, type Object3D, Vector3 } from "three";
import type { Size3Meters } from "../../domain/livingRoom/glbScale";

const size = new Vector3();

/** Measure an Object3D axis-aligned size in meters. */
export function measureObjectSizeMeters(object: Object3D): Size3Meters {
  const box = new Box3().setFromObject(object);
  box.getSize(size);
  return {
    x: Math.max(size.x, 1e-6),
    y: Math.max(size.y, 1e-6),
    z: Math.max(size.z, 1e-6),
  };
}
