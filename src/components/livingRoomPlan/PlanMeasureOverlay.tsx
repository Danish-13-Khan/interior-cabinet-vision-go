import {
  formatMeasureLengthMm,
  measureSegmentsFromPoints,
  type MeasureSnapPoint,
} from "../../domain/livingRoom";
import type { Point2Mm } from "../../domain/interiorProject";

export function PlanMeasureOverlay(props: {
  points: Point2Mm[];
  cursor: Point2Mm | null;
  snap: MeasureSnapPoint | null;
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
      {props.snap ? (
        <g>
          <circle cx={props.snap.x} cy={props.snap.z} r={45} className={`lr-measure-snap is-${props.snap.kind}`} />
          <text x={props.snap.x + 60} y={props.snap.z - 60} className="lr-measure-snap-label">
            {props.snap.label}
          </text>
        </g>
      ) : null}
    </g>
  );
}
