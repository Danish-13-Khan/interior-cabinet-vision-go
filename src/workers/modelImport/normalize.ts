import { Box3, Matrix4, Object3D, Vector3, type Mesh } from "three";
import type { Size3Mm } from "../../domain/interiorProject";

function isMesh(value: Object3D): value is Mesh {
  return (value as Mesh).isMesh === true;
}

/** Drop local AND parent transforms. Baking matrixWorld already includes every ancestor. */
function resetTransform(object: Object3D): void {
  object.position.set(0, 0, 0);
  object.rotation.set(0, 0, 0);
  object.scale.set(1, 1, 1);
  object.matrix.identity();
  object.matrixAutoUpdate = true;
}

/** Bake the full world chain, convert units, optionally Z-up to Y-up, then sit on y = 0. */
export function normalizeImportedObject(root: Object3D, options: { scaleToMm: number; rotateZUp: boolean }): Size3Mm {
  if (options.rotateZUp) root.rotateX(-Math.PI / 2);
  root.scale.setScalar(options.scaleToMm);
  root.updateMatrixWorld(true);
  const meshes: Mesh[] = [];
  root.traverse((child) => {
    if (isMesh(child) && child.geometry) meshes.push(child);
  });
  for (const mesh of meshes) {
    mesh.geometry = mesh.geometry.clone();
    mesh.geometry.applyMatrix4(mesh.matrixWorld);
  }
  root.traverse(resetTransform);
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(root);
  const center = bounds.getCenter(new Vector3());
  const shift = new Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z);
  for (const mesh of meshes) mesh.geometry.applyMatrix4(shift);
  root.updateMatrixWorld(true);
  const settled = new Box3().setFromObject(root);
  const size = settled.getSize(new Vector3());
  return {
    widthMm: Math.max(size.x, 1e-6),
    heightMm: Math.max(size.y, 1e-6),
    depthMm: Math.max(size.z, 1e-6),
  };
}

export function bboxMinY(root: Object3D): number {
  return new Box3().setFromObject(root).min.y;
}

export function largestExtent(root: Object3D): number {
  const bounds = new Box3().setFromObject(root);
  if (bounds.isEmpty()) return 0;
  const size = bounds.getSize(new Vector3());
  return Math.max(size.x, size.y, size.z);
}
