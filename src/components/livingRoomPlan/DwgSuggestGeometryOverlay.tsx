import type { DwgSuggestHighlightStroke, DwgSuggestPlanRegion } from "../../domain/livingRoom";

export function DwgSuggestGeometryOverlay(props: {
  strokes: DwgSuggestHighlightStroke[];
  region: DwgSuggestPlanRegion | null;
  draftRegion: DwgSuggestPlanRegion | null;
}) {
  const region = props.draftRegion ?? props.region;
  if (!props.strokes.length && !region) return null;
  return (
    <g data-testid="lr-dwg-suggest-highlight" pointerEvents="none">
      {props.strokes.map((stroke, index) => (
        <polyline
          key={`${stroke.layer}-${index}`}
          className="lr-dwg-suggest-stroke"
          data-layer={stroke.layer}
          fill="none"
          points={stroke.points.map((point) => `${point.x},${point.z}`).join(" ")}
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
        />
      ) : null}
    </g>
  );
}
