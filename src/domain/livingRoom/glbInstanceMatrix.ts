import { Euler, Matrix4, Object3D, Quaternion, Vector3 } from "three";

/** Node placement times the mesh's pose inside the normalized GLB. */
export function glbInstanceMatrix(
  positionMm: { x: number; y: number; z: number },
  rotationDegrees: { x: number; y: number; z: number },
  scale: { x: number; y: number; z: number },
  local: Matrix4,
): Matrix4 {
  const rotation = new Quaternion().setFromEuler(new Euler(
    rotationDegrees.x * Math.PI / 180,
    rotationDegrees.y * Math.PI / 180,
    rotationDegrees.z * Math.PI / 180,
    "XYZ",
  ));
  return new Matrix4().compose(
    new Vector3(positionMm.x / 1000, positionMm.y / 1000, positionMm.z / 1000),
    rotation,
    new Vector3(scale.x, scale.y, scale.z),
  ).multiply(local);
}

/** Mesh matrix as a child of the template root, including the root's own offset. */
export function meshMatrixUnderTemplate(template: Object3D, mesh: Object3D): Matrix4 {
  template.updateMatrixWorld(true);
  const within = new Matrix4().copy(template.matrixWorld).invert().multiply(mesh.matrixWorld);
  return new Matrix4().copy(template.matrix).multiply(within);
}
