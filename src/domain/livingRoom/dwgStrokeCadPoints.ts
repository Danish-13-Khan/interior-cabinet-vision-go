import { transform, type Matrix, type Point } from "./dwgGeometryMath";

const COMMAND = /[ML]\s*(-?[\d.eE+]+)\s*[,\s]\s*(-?[\d.eE+]+)/g;

/** CAD vertices from an SVG path after the stroke matrix (blocks already expanded). */
export function dwgStrokeCadPoints(d: string, matrix: number[]): Point[] {
  const points: Point[] = [];
  COMMAND.lastIndex = 0;
  for (const match of d.matchAll(COMMAND)) {
    const x = Number(match[1]);
    const y = Number(match[2]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    points.push(transform({ x, y }, matrix as Matrix));
  }
  return points;
}
