/** Meters (extract) ↔ mm (InteriorProject). */
export const M_TO_MM = 1000;
export const OPENING_END_TOL_M = 0.025;
export const MIN_WALL_THICK_M = 0.15;
export const SNAP_TOL_M = 0.15;
/** Extend dangling T-stems onto a through wall (vision extract gaps). */
export const GAP_CLOSE_M = 0.5;
/** Meet two dangling orthogonal endpoints at their line intersection. */
export const L_JOIN_M = 0.3;
export const MIN_SEG_LEN_M = 0.12;

export function mToMm(m: number): number {
  return Math.round(m * M_TO_MM);
}

export function pointMToMm(p: [number, number]): { x: number; z: number } {
  return { x: mToMm(p[0]), z: mToMm(p[1]) };
}
