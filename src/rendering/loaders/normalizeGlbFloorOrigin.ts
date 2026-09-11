import { Box3, type Object3D, Vector3 } from "three";
import type { Size3Meters } from "../../domain/livingRoom/glbScale";

const center = new Vector3();
const size = new Vector3();

/**
 * Floor-center a GLB root using local AABB only.
 * Detaches briefly so parent translation/scale cannot leak into local position.
 */
export function normalizeGlbFloorOrigin(scene: Object3D): Size3Meters {
  const parent = scene.parent;
  if (parent) parent.remove(scene);

  scene.position.set(0, 0, 0);
  scene.updateMatrixWorld(true);

  const bounds = new Box3().setFromObject(scene);
  bounds.getCenter(center);
  bounds.getSize(size);
  scene.position.set(-center.x, -bounds.min.y, -center.z);

  if (parent) parent.add(scene);
  scene.updateMatrixWorld(true);

  return {
    x: Math.max(size.x, 1e-6),
    y: Math.max(size.y, 1e-6),
    z: Math.max(size.z, 1e-6),
  };
}
