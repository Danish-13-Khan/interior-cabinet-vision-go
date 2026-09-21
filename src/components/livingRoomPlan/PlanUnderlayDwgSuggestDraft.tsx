import type { DwgSuggestSelectionUi } from "../../hooks/useDwgSuggestSelection";

export function PlanUnderlayDwgSuggestDraft({ locked, selection }: {
  locked: boolean;
  selection: DwgSuggestSelectionUi;
}) {
  const candidates = selection.draft?.candidates ?? [];
  const closed = new Set(candidates.filter((item) => item.closed).map((item) => item.chainId)).size;
  const open = new Set(candidates.filter((item) => !item.closed).map((item) => item.chainId)).size;
  const covered = candidates.filter((item) => item.overlap === "covered").length;
  const partial = candidates.filter((item) => item.overlap === "partial").length;
  return (
    <div className="lr-underlay-dwg-suggest-draft">
      <label>
        <span>Thickness (mm)</span>
        <input
          type="number"
          min="50"
          max="500"
          step="10"
          data-testid="lr-dwg-suggest-thickness"
          disabled={locked}
          value={selection.thicknessMm}
          onChange={(event) => selection.onThicknessMm(Number(event.target.value) || selection.thicknessMm)}
        />
      </label>
      <label>
        <span>Height (mm)</span>
        <input
          type="number"
          min="1800"
          max="6000"
          step="50"
          data-testid="lr-dwg-suggest-height"
          disabled={locked}
          value={selection.heightMm}
          onChange={(event) => selection.onHeightMm(Number(event.target.value) || selection.heightMm)}
        />
      </label>
      {selection.draft ? (
        <div data-testid="lr-dwg-suggest-draft">
          <p className="lr-underlay-dwg-suggest-note" data-testid="lr-dwg-suggest-draft-summary">
            {selection.acceptedCount} of {selection.draft.candidates.length} accepted
            ({closed} closed, {open} open
            {covered ? `, ${covered} already in the model` : ""}
            {partial ? `, ${partial} partial overlap` : ""}
            ). Click a highlight to reject. Covered strokes cannot be applied.
          </p>
          <div className="lr-underlay-dwg-suggest-region-actions">
            <button type="button" className="is-secondary" data-testid="lr-dwg-suggest-accept-all" disabled={locked} onClick={() => selection.onSetAccepted(true)}>Accept all</button>
            <button type="button" className="is-secondary" data-testid="lr-dwg-suggest-reject-all" disabled={locked} onClick={() => selection.onSetAccepted(false)}>Reject all</button>
            <button type="button" className="is-secondary" data-testid="lr-dwg-suggest-clear-draft" disabled={locked} onClick={selection.onClearDraft}>Clear preview</button>
          </div>
          <button
            type="button"
            data-testid="lr-dwg-suggest-apply"
            disabled={locked || selection.acceptedCount === 0}
            onClick={selection.onApply}
          >
            Apply {selection.acceptedCount} walls
          </button>
        </div>
      ) : null}
    </div>
  );
}
