import {
  formatMeasureLengthMm,
  measureSegmentsFromPoints,
} from "../../domain/livingRoom";
import type { Point2Mm } from "../../domain/interiorProject";
import type { PlanSnapResult } from "../../domain/livingRoom/planSnapEngine";
import { PlanSnapMarker } from "./PlanSnapMarker";

export function PlanMeasureOverlay(props: {
  points: Point2Mm[];
  cursor: Point2Mm | null;
  snap: PlanSnapResult | null;
  /** Pick radius in world mm; keeps the marker the same size on screen at any zoom. */
  markerMm?: number;
  active: boolean;
  mode?: "measure" | "calibrate";
}) {
  if (!props.active) return null;
  const mode = props.mode ?? "measure";
  const draftPoints = props.cursor && props.points.length > 0
    ? [...props.points, props.cursor]
    : props.points;
  const segments = measureSegmentsFromPoints(draftPoints);
  return (
    <g className={`lr-measure-overlay ${mode === "calibrate" ? "is-calibrate" : ""}`} pointerEvents="none" aria-label={mode === "calibrate" ? "Calibrate underlay" : "Measure tool"}>
      {segments.map((segment, index) => {
        const mx = (segment.a.x + segment.b.x) / 2;
        const mz = (segment.a.z + segment.b.z) / 2;
        return (
          <g key={`seg-${index}`}>
            <line
              x1={segment.a.x} y1={segment.a.z} x2={segment.b.x} y2={segment.b.z}
              className="lr-measure-segment"
            />
            <text x={mx} y={mz - 40} className="lr-measure-label">
              {formatMeasureLengthMm(segment.lengthMm)}
            </text>
          </g>
        );
      })}
      {props.points.map((point, index) => (
        <circle
          key={`pt-${index}`}
          cx={point.x}
          cy={point.z}
          r={35}
          className="lr-measure-point"
          data-testid={mode === "calibrate" ? "lr-calibrate-point" : "lr-measure-point"}
        />
      ))}
      <PlanSnapMarker snap={props.snap} sizeMm={props.markerMm ?? 40} freeLabel="Free" testId="lr-measure-snap" />
    </g>
  );
}
