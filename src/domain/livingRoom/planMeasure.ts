import type { Point2Mm } from "../interiorProject";

/**
 * Measure tool arithmetic. Snapping lives in `planSnapEngine`, shared with
 * every other plan tool (roadmap S1).
 */
export type MeasureSegment = {
  a: Point2Mm;
  b: Point2Mm;
  lengthMm: number;
};

export function measureLengthMm(a: Point2Mm, b: Point2Mm): number {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

export function formatMeasureLengthMm(lengthMm: number): string {
  const rounded = Math.round(lengthMm);
  return `${rounded.toLocaleString("en-US")} mm`;
}

export function appendMeasurePoint(points: readonly Point2Mm[], next: Point2Mm): Point2Mm[] {
  if (points.length === 0) return [next];
  const last = points[points.length - 1]!;
  if (Math.hypot(next.x - last.x, next.z - last.z) < 0.5) return [...points];
  return [...points, next];
}

export function measureSegmentsFromPoints(points: readonly Point2Mm[]): MeasureSegment[] {
  const segments: MeasureSegment[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    segments.push({ a, b, lengthMm: measureLengthMm(a, b) });
  }
  return segments;
}
