import {
  DEFAULT_DRAFTING_DISPLAY,
  type DraftingDisplayPreferences,
  type ProjectDrafting,
} from "../domain/draftingAnnotations";

type DraftingPanelProps = {
  drafting: ProjectDrafting;
  display: DraftingDisplayPreferences;
  onDisplayChange: (patch: Partial<DraftingDisplayPreferences>) => void;
  onDeleteNote: (id: string) => void;
  onDeleteLeader: (id: string) => void;
};

export function DraftingPanel({
  drafting,
  display,
  onDisplayChange,
  onDeleteNote,
  onDeleteLeader,
}: DraftingPanelProps) {
  const prefs = { ...DEFAULT_DRAFTING_DISPLAY, ...display };

  return (
    <div className="control-section drafting-panel">
      <div className="section-heading">
        <h2>2D Drafting</h2>
        <span>
          {drafting.notes.length} notes · {drafting.leaders.length} leaders
        </span>
      </div>

      <div className="drafting-toggle-grid">
        {(
          [
            ["showCabinetTags", "Cabinet tags"],
            ["showOpeningTags", "Opening tags"],
            ["showApplianceTags", "Appliance tags"],
            ["showOverallDims", "Overall dims"],
            ["showDimensionChains", "Chain dims"],
            ["showRunDims", "Run dims"],
            ["showSelectedDims", "Selected dims"],
            ["showOpeningDims", "Opening dims"],
            ["showClearanceDims", "Clearance dims"],
            ["showWallLabels", "Wall labels"],
            ["showRunBands", "Run bands"],
            ["showRunLabels", "Run labels"],
            ["showFillers", "Fillers / gaps"],
            ["showCountertopSpans", "Countertop spans"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="drafting-toggle">
            <input
              type="checkbox"
              checked={Boolean(prefs[key])}
              onChange={(event) =>
                onDisplayChange({ [key]: event.currentTarget.checked })
              }
            />
            {label}
          </label>
        ))}
      </div>

      <label className="drafting-min-seg">
        Min dim segment
        <input
          type="number"
          min={10}
          max={200}
          step={5}
          value={prefs.dimMinSegmentMm}
          onChange={(event) =>
            onDisplayChange({ dimMinSegmentMm: Number(event.currentTarget.value) })
          }
        />
        <span>mm</span>
      </label>

      {drafting.notes.length > 0 || drafting.leaders.length > 0 ? (
        <div className="drafting-annotation-list">
          {drafting.notes.map((note) => (
            <div key={note.id} className="drafting-annotation-row">
              <div>
                <strong>Note · {note.view}</strong>
                <span>{note.text}</span>
              </div>
              <button type="button" className="danger" onClick={() => onDeleteNote(note.id)}>
                Delete
              </button>
            </div>
          ))}
          {drafting.leaders.map((leader) => (
            <div key={leader.id} className="drafting-annotation-row">
              <div>
                <strong>Leader · {leader.view}</strong>
                <span>{leader.text}</span>
              </div>
              <button
                type="button"
                className="danger"
                onClick={() => onDeleteLeader(leader.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="helper-note">
          Use Note / Leader tools in the drawing toolbar to place annotations on the active 2D
          view.
        </p>
      )}
    </div>
  );
}
