import {
  technicalObjectLabel,
  type TechnicalObjectSelection,
} from "../domain/draftingEdit";
import {
  clampProjectDrafting,
  type ProjectDrafting,
} from "../domain/draftingAnnotations";

type TechnicalObjectToolbarProps = {
  selection: TechnicalObjectSelection;
  drafting: ProjectDrafting | undefined;
  draftingTool: "select" | "note" | "leader";
  onUpdateNoteText: (id: string, text: string) => void;
  onUpdateLeaderText: (id: string, text: string) => void;
  onDeleteNote: (id: string) => void;
  onDeleteLeader: (id: string) => void;
  onResetDimOffset: (id: string) => void;
  onResetTagOffset: (cabinetId: string) => void;
};

export function TechnicalObjectToolbar({
  selection,
  drafting,
  draftingTool,
  onUpdateNoteText,
  onUpdateLeaderText,
  onDeleteNote,
  onDeleteLeader,
  onResetDimOffset,
  onResetTagOffset,
}: TechnicalObjectToolbarProps) {
  if (draftingTool !== "select" || !selection) return null;
  if (selection.kind === "opening") return null;

  const safe = clampProjectDrafting(drafting);
  const label = technicalObjectLabel(selection);

  return (
    <div className="technical-object-toolbar" role="toolbar" aria-label="Object edit">
      <span className="technical-object-toolbar-meta">{label}</span>
      <div className="technical-object-toolbar-group">
        {selection.kind === "note" ? (
          <>
            <button
              type="button"
              className="tb-btn"
              onClick={() => {
                const note = safe.notes.find((item) => item.id === selection.id);
                const next = window.prompt("Edit note:", note?.text ?? "");
                if (next == null || !next.trim()) return;
                onUpdateNoteText(selection.id, next.trim());
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="tb-btn"
              onClick={() => onDeleteNote(selection.id)}
            >
              Delete
            </button>
          </>
        ) : null}
        {selection.kind === "leader" ? (
          <>
            <button
              type="button"
              className="tb-btn"
              onClick={() => {
                const leader = safe.leaders.find((item) => item.id === selection.id);
                const next = window.prompt("Edit leader:", leader?.text ?? "");
                if (next == null || !next.trim()) return;
                onUpdateLeaderText(selection.id, next.trim());
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="tb-btn"
              onClick={() => onDeleteLeader(selection.id)}
            >
              Delete
            </button>
          </>
        ) : null}
        {selection.kind === "dim" ? (
          <button
            type="button"
            className="tb-btn"
            onClick={() => onResetDimOffset(selection.id)}
          >
            Reset anchor
          </button>
        ) : null}
        {selection.kind === "tag" ? (
          <button
            type="button"
            className="tb-btn"
            onClick={() => onResetTagOffset(selection.cabinetId)}
          >
            Reset tag
          </button>
        ) : null}
        {selection.kind === "cabinet" ? (
          <span className="technical-object-toolbar-hint">Drag to move · click dims to edit</span>
        ) : null}
      </div>
    </div>
  );
}
