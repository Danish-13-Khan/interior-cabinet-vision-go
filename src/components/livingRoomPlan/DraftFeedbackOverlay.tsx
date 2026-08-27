import type { Point2Mm } from "../../domain/interiorProject";
import { formatPlanDimension, type PlanDisplayUnit } from "../../domain/livingRoom";

function dimension(value: number, unit: PlanDisplayUnit) { return formatPlanDimension(Math.abs(value), unit); }

export function DraftFeedbackOverlay(props: {
  start: Point2Mm;
  end: Point2Mm;
  snapTarget?: Point2Mm | null;
  snapLabel?: string;
  label?: string;
  unit: PlanDisplayUnit;
}) {
  const { start, end } = props;
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  const mid = { x: (start.x + end.x) / 2, z: (start.z + end.z) / 2 };
  const angle = Math.atan2(dz, dx) * 180 / Math.PI;
  return <g className="lr-draft-feedback" pointerEvents="none">
    <line className="lr-draft-guide" x1={end.x} y1={-10000} x2={end.x} y2={10000} />
    <line className="lr-draft-guide" x1={-10000} y1={end.z} x2={10000} y2={end.z} />
    <line className="lr-draft-axis" x1={start.x} y1={start.z} x2={end.x} y2={start.z} />
    <line className="lr-draft-axis" x1={end.x} y1={start.z} x2={end.x} y2={end.z} />
    <text className="lr-draft-length" transform={`translate(${mid.x} ${mid.z - 95}) rotate(${angle})`}>
      {props.label ?? dimension(length, props.unit)}
    </text>
    <text className="lr-draft-axis-label" x={mid.x} y={start.z - 65}>{dimension(dx, props.unit)}</text>
    <text className="lr-draft-axis-label" x={end.x + 65} y={mid.z}>{dimension(dz, props.unit)}</text>
    {props.snapTarget ? <><circle className="lr-draft-snap-target" cx={props.snapTarget.x} cy={props.snapTarget.z} r="95" />
      <text className="lr-draft-snap-label" x={props.snapTarget.x} y={props.snapTarget.z - 130}>{props.snapLabel ?? "Node snap"}</text></> : null}
  </g>;
}
