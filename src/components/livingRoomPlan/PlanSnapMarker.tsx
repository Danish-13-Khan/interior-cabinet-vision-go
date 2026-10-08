import type { ReactElement } from "react";
import type { PlanSnapResult } from "../../domain/livingRoom/planSnapEngine";

/**
 * The one snap indicator for every plan tool (roadmap §4.2). Shape by kind;
 * `sizeMm` is the pick radius in world mm (8 screen px), so the marker keeps
 * the same pixel size at any zoom. Strokes use non-scaling-stroke.
 */
export function PlanSnapMarker(props: {
  snap: PlanSnapResult | null;
  sizeMm: number;
  /** Shown when nothing snapped (measure tool); omitted markers draw nothing. */
  freeLabel?: string;
  testId?: string;
}) {
  const { snap } = props;
  if (!snap) return null;
  if (!snap.candidate && !props.freeLabel) return null;
  const kind = snap.candidate?.kind ?? "free";
  const label = snap.candidate?.label ?? props.freeLabel ?? "";
  const s = Math.max(1, props.sizeMm);
  const { x, z } = snap.point;
  const fontSize = s * 1.6;
  const common = { className: `lr-snap-marker is-${kind}`, vectorEffect: "non-scaling-stroke" as const };
  let shape: ReactElement;
  switch (kind) {
    case "node":
      shape = <rect {...common} x={x - s} y={z - s} width={s * 2} height={s * 2} />;
      break;
    case "dwg-end":
      shape = <polygon {...common} points={`${x},${z - s * 1.2} ${x + s * 1.2},${z} ${x},${z + s * 1.2} ${x - s * 1.2},${z}`} />;
      break;
    case "intersection":
      shape = <g>
        <line {...common} x1={x - s * 1.3} y1={z - s * 1.3} x2={x + s * 1.3} y2={z + s * 1.3} />
        <line {...common} x1={x - s * 1.3} y1={z + s * 1.3} x2={x + s * 1.3} y2={z - s * 1.3} />
      </g>;
      break;
    case "midpoint":
      shape = <polygon {...common} points={`${x},${z - s * 1.3} ${x + s * 1.2},${z + s * 0.9} ${x - s * 1.2},${z + s * 0.9}`} />;
      break;
    case "on-wall":
      shape = <line {...common} x1={x - s * 1.4} y1={z} x2={x + s * 1.4} y2={z} />;
      break;
    case "axis-h":
      shape = <line {...common} x1={x - s * 6} y1={z} x2={x + s * 6} y2={z} />;
      break;
    case "axis-v":
      shape = <line {...common} x1={x} y1={z - s * 6} x2={x} y2={z + s * 6} />;
      break;
    case "grid":
      shape = <circle {...common} cx={x} cy={z} r={s * 0.35} />;
      break;
    case "free":
      shape = <circle {...common} cx={x} cy={z} r={s * 0.6} />;
      break;
    default:
      shape = <circle {...common} cx={x} cy={z} r={s} />;
  }
  return <g className="lr-snap-marker-group" pointerEvents="none" data-testid={props.testId} data-snap-kind={kind}>
    {shape}
    {label ? <text className="lr-snap-marker-label" x={x + s * 1.6} y={z - s * 1.2}
      style={{ fontSize, textAnchor: "start" }}>{label}</text> : null}
  </g>;
}
