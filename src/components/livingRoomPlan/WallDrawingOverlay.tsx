import type { Point2Mm } from "../../domain/interiorProject";

export function WallDrawingOverlay({ preview, active }: {
  preview: readonly [Point2Mm, Point2Mm] | null;
  active: boolean;
}) {
  if (!active || !preview) return null;
  const [start, end] = preview;
  return <g className="lr-wall-drawing-overlay" pointerEvents="none">
    <line x1={start.x} y1={start.z} x2={end.x} y2={end.z} />
    <circle cx={start.x} cy={start.z} r="40" />
    <circle cx={end.x} cy={end.z} r="40" />
  </g>;
}
