import type { Point2Mm } from "../../domain/interiorProject";
import { DraftFeedbackOverlay } from "./DraftFeedbackOverlay";
import type { PlanDisplayUnit } from "../../domain/livingRoom";
import type { PlanSnapResult } from "../../domain/livingRoom/planSnapEngine";

export function WallDrawingOverlay({ preview, active, snap, markerMm, unit }: {
  preview: readonly [Point2Mm, Point2Mm] | null;
  active: boolean;
  snap?: PlanSnapResult | null;
  markerMm?: number;
  unit: PlanDisplayUnit;
}) {
  if (!active || !preview) return null;
  const [start, end] = preview;
  return <g className="lr-wall-drawing-overlay" pointerEvents="none">
    <DraftFeedbackOverlay start={start} end={end} snap={snap} markerMm={markerMm} unit={unit} />
    <line x1={start.x} y1={start.z} x2={end.x} y2={end.z} />
    <circle cx={start.x} cy={start.z} r="40" />
    <circle cx={end.x} cy={end.z} r="40" />
  </g>;
}
