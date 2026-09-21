export type Point = { x: number; y: number };
export type Matrix = [number, number, number, number, number, number];
export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
export function multiply(a: Matrix, b: Matrix): Matrix {
  return [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
}
export function transform(p: Point, m: Matrix): Point {
  return { x: m[0]*p.x+m[2]*p.y+m[4], y: m[1]*p.x+m[3]*p.y+m[5] };
}
export function pose(x: number, y: number, angle = 0, sx = 1, sy = 1): Matrix {
  return [Math.cos(angle)*sx, Math.sin(angle)*sx, -Math.sin(angle)*sy, Math.cos(angle)*sy, x, y];
}
export const TAU = Math.PI*2;
export const mod = (a: number) => ((a % TAU)+TAU)%TAU;
/** Exact SVG elliptical arc plus exact extrema after any affine block transform. */
export function ellipseArc(center: Point, rx: number, ry: number, rotation: number, start: number, sweep: number, matrix: Matrix) {
  if (![center.x, center.y, rx, ry, rotation, start, sweep, ...matrix].every(Number.isFinite) || rx <= 0 || ry <= 0 || Math.abs(sweep) < 1e-12) throw new Error('Invalid arc');
  const local = pose(center.x, center.y, rotation, rx, ry);
  const combined = multiply(matrix, local);
  const at = (angle: number) => transform({ x: Math.cos(angle), y: Math.sin(angle) }, local);
  const points: Point[] = [at(start), at(start+sweep)];
  for (const angle of [Math.atan2(combined[2], combined[0]), Math.atan2(combined[3], combined[1])]) {
    for (const t of [angle, angle+Math.PI]) if (Math.abs(sweep) >= TAU-1e-9 || mod((t-start)*Math.sign(sweep)) <= Math.abs(sweep)+1e-9) points.push(at(t));
  }
  const first = at(start);
  const pieces = Math.abs(sweep) >= TAU-1e-9 ? 2 : 1;
  let d = `M${first.x},${first.y}`;
  for (let i = 1; i <= pieces; i++) {
    const p = at(start+sweep*i/pieces);
    d += ` A${rx},${ry} ${rotation*180/Math.PI} ${Math.abs(sweep/pieces)>Math.PI ? 1 : 0},${sweep>0 ? 1 : 0} ${p.x},${p.y}`;
  }
  return { d, points };
}
export function bulgeArc(a: Point, b: Point, bulge: number, matrix: Matrix) {
  const dx = b.x-a.x, dy = b.y-a.y, length = Math.hypot(dx,dy);
  if (!length || !Number.isFinite(bulge)) throw new Error('Invalid bulge');
  const offset = length*(1-bulge*bulge)/(4*bulge);
  const center = { x: (a.x+b.x)/2-dy/length*offset, y: (a.y+b.y)/2+dx/length*offset };
  const radius = length*(1+bulge*bulge)/(4*Math.abs(bulge));
  return ellipseArc(center, radius, radius, 0, Math.atan2(a.y-center.y,a.x-center.x), 4*Math.atan(bulge), matrix);
}
