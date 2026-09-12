import type { BufferGeometry } from "three";

/** One UV unit represents one metre on each box face, before material tiling.
 * BoxGeometry and RoundedBoxGeometry both use +X, -X, +Y, -Y, +Z, -Z groups.
 * Apply once to new geometry, before putting it in the shared geometry cache.
 */
export function applyBoxSurfaceUvs(
  geometry: BufferGeometry,
  sizeMm: { width: number; height: number; depth: number },
) {
  const uv = geometry.getAttribute("uv");
  if (!uv) return;
  const w = sizeMm.width / 1000;
  const h = sizeMm.height / 1000;
  const d = sizeMm.depth / 1000;
  const faceSizes = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (const group of geometry.groups) {
    const size = faceSizes[group.materialIndex ?? 0];
    if (!size) continue;
    const vertices = new Set<number>();
    for (let offset = group.start; offset < group.start + group.count; offset++) {
      vertices.add(geometry.index ? geometry.index.getX(offset) : offset);
    }
    for (const vertex of vertices) {
      uv.setXY(vertex, uv.getX(vertex) * size[0], uv.getY(vertex) * size[1]);
    }
  }
  uv.needsUpdate = true;
}
