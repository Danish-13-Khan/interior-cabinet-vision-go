import type { Point2Mm } from "../../domain/interiorProject";
import { DraftFeedbackOverlay } from "./DraftFeedbackOverlay";
import { formatPlanDimension, type PlanDisplayUnit } from "../../domain/livingRoom";

function path(points: Point2Mm[], close = false) {
  if (!points.length) return "";
  return `${points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.z}`).join(" ")}${close ? " Z" : ""}`;
}

export function RoomDrawingOverlay({ polygon, rectangle, cursor, active, unit }: {
  polygon: Point2Mm[]; rectangle: Point2Mm[] | null; cursor: Point2Mm | null; active: boolean; unit: PlanDisplayUnit;
}) {
  if (!active) return null;
  return <g className="lr-room-drawing-overlay" pointerEvents="none">
    {rectangle ? <DraftFeedbackOverlay start={rectangle[0]!} end={rectangle[2]!} unit={unit} label={`${formatPlanDimension(Math.abs(rectangle[2]!.x - rectangle[0]!.x), unit)} × ${formatPlanDimension(Math.abs(rectangle[2]!.z - rectangle[0]!.z), unit)}`} /> : null}
    {!rectangle && polygon.length && cursor ? <><DraftFeedbackOverlay start={polygon.at(-1)!} end={cursor} unit={unit} />
      <line className="lr-room-draft-tail" x1={polygon.at(-1)!.x} y1={polygon.at(-1)!.z} x2={cursor.x} y2={cursor.z} /></> : null}
    {polygon.length ? <><path d={path(polygon)} /><g>{polygon.map((point, index) => <circle key={index} cx={point.x} cy={point.z} r="45" />)}</g></> : null}
    {rectangle ? <path className="is-rectangle" d={path(rectangle, true)} /> : null}
    <text x="0" y="-420">Click points for a polygon, or drag for a rectangle</text>
  </g>;
}
