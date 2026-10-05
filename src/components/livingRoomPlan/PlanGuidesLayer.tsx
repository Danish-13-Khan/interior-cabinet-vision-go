import type { PointerEvent as ReactPointerEvent } from "react";
import type { PlanGuide } from "../../domain/livingRoom/planGuides";

type Extent = { minX: number; maxX: number; minZ: number; maxZ: number };

const OVERHANG_MM = 1500;
const BUBBLE_GAP_MM = 600;
const BUBBLE_RADIUS_MM = 260;

/** Plan guides in the dash-dot centre-line style, with a grid bubble at the top / left end. */
export function PlanGuidesLayer(props: {
  guides: readonly PlanGuide[];
  extent: Extent;
  selectedId: string | null;
  interactive: boolean;
  /** Full-length hit strip (Guide tools only); in Select mode just the bubble, so walls on a guide stay clickable. */
  lineHit: boolean;
  hitWidthMm: number;
  onStart: (event: ReactPointerEvent<SVGElement>, guide: PlanGuide) => void;
}) {
  if (!props.guides.length) return null;
  const minX = props.extent.minX - OVERHANG_MM;
  const maxX = props.extent.maxX + OVERHANG_MM;
  const minZ = props.extent.minZ - OVERHANG_MM;
  const maxZ = props.extent.maxZ + OVERHANG_MM;
  return (
    <g className="lr-plan-guides" data-testid="lr-plan-guides">
      {props.guides.map((guide) => {
        const vertical = guide.axis === "x";
        const line = vertical
          ? { x1: guide.positionMm, y1: minZ, x2: guide.positionMm, y2: maxZ }
          : { x1: minX, y1: guide.positionMm, x2: maxX, y2: guide.positionMm };
        const bubble = vertical
          ? { cx: guide.positionMm, cy: minZ - BUBBLE_GAP_MM }
          : { cx: minX - BUBBLE_GAP_MM, cy: guide.positionMm };
        const classes = [
          "lr-plan-guide",
          props.selectedId === guide.id ? "is-selected" : "",
          guide.locked ? "is-locked" : "",
        ].filter(Boolean).join(" ");
        const startDrag = props.interactive
          ? (event: ReactPointerEvent<SVGElement>) => props.onStart(event, guide)
          : undefined;
        return (
          <g key={guide.id} className={classes} data-guide-id={guide.id} data-guide-axis={guide.axis}
            data-guide-position={guide.positionMm} data-guide-label={guide.label ?? ""}>
            <line {...line} className="lr-center-line lr-plan-guide-line" pointerEvents="none" />
            <line {...line} className="lr-plan-guide-hit" strokeWidth={props.hitWidthMm}
              pointerEvents={props.interactive && props.lineHit ? "stroke" : "none"} onPointerDown={startDrag} />
            <g className="lr-plan-guide-bubble" pointerEvents={props.interactive ? "all" : "none"} onPointerDown={startDrag}>
              <circle cx={bubble.cx} cy={bubble.cy} r={BUBBLE_RADIUS_MM} />
              <text x={bubble.cx} y={bubble.cy} textAnchor="middle" dominantBaseline="central">{guide.label ?? ""}</text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
