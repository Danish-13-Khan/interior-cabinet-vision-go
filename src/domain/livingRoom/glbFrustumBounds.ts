import { Mesh, SkinnedMesh, type Object3D } from "three";

/**
 * GLB children were excluded from the frustum because their bounds were stale.
 * Recompute the geometry sphere, then allow culling. A skinned mesh stays
 * unculled: its bind pose does not cover the posed surface.
 */
export function enableGlbFrustumCulling(root: Object3D) {
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    if (child instanceof SkinnedMesh) {
      child.frustumCulled = false;
      return;
    }
    const position = child.geometry?.getAttribute("position");
    if (!position || position.count === 0) return;
    child.geometry.computeBoundingBox();
    child.geometry.computeBoundingSphere();
    child.frustumCulled = true;
  });
}
