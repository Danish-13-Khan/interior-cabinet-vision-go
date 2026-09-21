import type { PointerEvent as ReactPointerEvent } from "react";
import type { DwgSuggestHighlightStroke, DwgSuggestPlanRegion } from "../../domain/livingRoom";

export function DwgSuggestGeometryOverlay(props: {
  strokes: DwgSuggestHighlightStroke[];
  region: DwgSuggestPlanRegion | null;
  draftRegion: DwgSuggestPlanRegion | null;
  onToggleCandidate?: (id: string) => void;
}) {
  const region = props.draftRegion ?? props.region;
  if (!props.strokes.length && !region) return null;
  function toggle(event: ReactPointerEvent<SVGPolylineElement>, id?: string) {
    if (!id || !props.onToggleCandidate) return;
    event.preventDefault();
    event.stopPropagation();
    props.onToggleCandidate(id);
  }
  return (
    <g data-testid="lr-dwg-suggest-highlight">
      {props.strokes.map((stroke, index) => (
        <polyline
          key={stroke.candidateId ?? `${stroke.layer}-${index}`}
          className={`lr-dwg-suggest-stroke${stroke.accepted === false ? " is-rejected" : ""}${stroke.closed ? " is-closed" : ""}${(stroke.overlap ?? "none") !== "none" ? ` is-${stroke.overlap}` : ""}`}
          data-layer={stroke.layer}
          data-testid={stroke.candidateId ? "lr-dwg-suggest-candidate" : undefined}
          data-candidate-id={stroke.candidateId}
          data-overlap={stroke.overlap ?? "none"}
          data-accepted={stroke.accepted === false ? "false" : "true"}
          fill="none"
          pointerEvents={stroke.candidateId && (stroke.overlap ?? "none") === "none" ? "stroke" : "none"}
          points={stroke.points.map((point) => `${point.x},${point.z}`).join(" ")}
          onPointerDown={(event) => toggle(event, stroke.candidateId)}
        />
      ))}
      {region ? (
        <rect
          className={`lr-dwg-suggest-region${props.draftRegion ? " is-draft" : ""}`}
          data-testid="lr-dwg-suggest-region"
          x={region.minX}
          y={region.minZ}
          width={region.maxX - region.minX}
          height={region.maxZ - region.minZ}
          pointerEvents="none"
        />
      ) : null}
    </g>
  );
}
