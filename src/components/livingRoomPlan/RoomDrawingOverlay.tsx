import type { Point2Mm } from "../../domain/interiorProject";

function path(points: Point2Mm[], close = false) {
  if (!points.length) return "";
  return `${points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.z}`).join(" ")}${close ? " Z" : ""}`;
}

export function RoomDrawingOverlay({ polygon, rectangle, active }: {
  polygon: Point2Mm[]; rectangle: Point2Mm[] | null; active: boolean;
}) {
  if (!active) return null;
  return <g className="lr-room-drawing-overlay" pointerEvents="none">
    {polygon.length ? <><path d={path(polygon)} /><g>{polygon.map((point, index) => <circle key={index} cx={point.x} cy={point.z} r="45" />)}</g></> : null}
    {rectangle ? <path className="is-rectangle" d={path(rectangle, true)} /> : null}
    <text x="0" y="-420">Click points for a polygon, or drag for a rectangle</text>
  </g>;
}
