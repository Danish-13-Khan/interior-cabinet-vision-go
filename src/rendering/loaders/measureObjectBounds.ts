import { Box3, type Object3D, Vector3 } from "three";
import type { Size3Meters } from "../../domain/livingRoom/glbScale";

const size = new Vector3();

function readSize(object: Object3D): Size3Meters {
  const box = new Box3().setFromObject(object);
  box.getSize(size);
  return {
    x: Math.max(size.x, 1e-6),
    y: Math.max(size.y, 1e-6),
    z: Math.max(size.z, 1e-6),
  };
}

/** Measure an Object3D axis-aligned size in meters (includes current object scale). */
export function measureObjectSizeMeters(object: Object3D): Size3Meters {
  return readSize(object);
}

/** Native AABB with local scale forced to 1 so later target scaling is not compounded. */
export function measureUnscaledObjectSizeMeters(object: Object3D): Size3Meters {
  const { x, y, z } = object.scale;
  object.scale.set(1, 1, 1);
  object.updateWorldMatrix(true, true);
  try {
    return readSize(object);
  } finally {
    object.scale.set(x, y, z);
    object.updateWorldMatrix(true, true);
  }
}
