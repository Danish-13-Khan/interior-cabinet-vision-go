import { Box3, Matrix4, Object3D, Vector3, type Mesh } from "three";
import type { Size3Mm } from "../../domain/interiorProject";

function isMesh(value: Object3D): value is Mesh {
  return (value as Mesh).isMesh === true;
}

/** Bake root transforms, convert units, optionally Z-up to Y-up, then sit the model on y = 0. */
export function normalizeImportedObject(root: Object3D, options: { scaleToMm: number; rotateZUp: boolean }): Size3Mm {
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  if (options.rotateZUp) root.rotateX(-Math.PI / 2);
  root.scale.setScalar(options.scaleToMm);
  root.updateMatrixWorld(true);
  root.traverse((child) => {
    if (!isMesh(child) || !child.geometry) return;
    child.geometry = child.geometry.clone();
    child.geometry.applyMatrix4(child.matrixWorld);
    child.position.set(0, 0, 0);
    child.rotation.set(0, 0, 0);
    child.scale.set(1, 1, 1);
    child.updateMatrix();
  });
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(root);
  const center = bounds.getCenter(new Vector3());
  const shift = new Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z);
  root.traverse((child) => {
    if (isMesh(child) && child.geometry) child.geometry.applyMatrix4(shift);
  });
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
