import type { DwgSuggestSelectionUi } from "../../hooks/useDwgSuggestSelection";
import { PlanUnderlayDwgSuggestDraft } from "./PlanUnderlayDwgSuggestDraft";

export function PlanUnderlayDwgSuggest({
  locked,
  selection,
  onSuggestDwgWalls,
  onPlaceDwgCabinets,
}: {
  locked: boolean;
  selection?: DwgSuggestSelectionUi;
  onSuggestDwgWalls?: () => void;
  onPlaceDwgCabinets?: () => void;
}) {
  if (!onSuggestDwgWalls && !onPlaceDwgCabinets && !selection) return null;
  return (
    <div className="lr-underlay-dwg-suggest" data-testid="lr-underlay-dwg-suggest">
      {selection ? (
        <>
          <p className="lr-underlay-dwg-suggest-note">
            Centerline detection does not interpret paired wall edges. Hidden layers are never used.
          </p>
          {selection.skippedCurves > 0 ? (
            <p className="lr-underlay-dwg-suggest-note" data-testid="lr-dwg-suggest-skipped-curves">
              Skipped {selection.skippedCurves} curved segment{selection.skippedCurves === 1 ? "" : "s"}.
              Straight LINE and polyline edges only.
            </p>
          ) : null}
          <fieldset className="lr-underlay-dwg-suggest-layers" disabled={locked}>
            <legend>Detect walls from visible layers</legend>
            {selection.visibleLayers.length ? selection.visibleLayers.map((name) => (
              <label key={name}>
                <input
                  type="checkbox"
                  data-testid={`lr-dwg-suggest-layer-${name}`}
                  checked={selection.selectedLayers.includes(name)}
                  onChange={() => selection.onToggleLayer(name)}
                />
                {name}
              </label>
            )) : <small>No visible layers</small>}
          </fieldset>
          <div className="lr-underlay-dwg-suggest-region-actions">
            <button
              type="button"
              className={`is-secondary${selection.pickingRegion ? " is-active" : ""}`}
              data-testid="lr-dwg-suggest-region-pick"
              disabled={locked}
              onClick={selection.onPickRegion}
            >
              {selection.pickingRegion ? "Drag a region on the plan" : "Select detection region"}
            </button>
            <button
              type="button"
              className="is-secondary"
              data-testid="lr-dwg-suggest-region-clear"
              disabled={locked || (!selection.region && !selection.pickingRegion)}
              onClick={selection.onClearRegion}
            >
              Clear region
            </button>
          </div>
          <PlanUnderlayDwgSuggestDraft locked={locked} selection={selection} />
        </>
      ) : null}
      {onSuggestDwgWalls ? (
        <button
          type="button"
          className="is-secondary"
          data-testid="lr-underlay-suggest-walls"
          disabled={locked || Boolean(selection && (!selection.selectedLayers.length || selection.segmentCount === 0))}
          onClick={selection?.onPreview ?? onSuggestDwgWalls}
        >
          Preview wall candidates
        </button>
      ) : null}
      {onPlaceDwgCabinets ? (
        <button type="button" className="is-secondary" data-testid="lr-underlay-place-cabinets" disabled={locked} onClick={onPlaceDwgCabinets}>
          Place recognized cabinets
        </button>
      ) : null}
    </div>
  );
}
