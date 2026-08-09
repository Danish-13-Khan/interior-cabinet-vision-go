import { useEffect, useMemo, useState } from "react";
import {
  getProjectSheetSet,
  type SheetDocument,
  type SheetViewKind,
} from "../domain/sheetDocuments";
import type { CabinetProject } from "../domain/cabinetDimensions";

const PLACEABLE: Array<{ kind: SheetViewKind; label: string }> = [
  { kind: "top", label: "Plan" },
  { kind: "front", label: "Elev" },
  { kind: "side", label: "Side" },
  { kind: "section", label: "Sect" },
  { kind: "detail", label: "Det" },
];

type WorkspaceSheetBrowserProps = {
  project: CabinetProject;
  activeSheetId: string;
  onSelectSheet: (sheetId: string) => void;
  onRenameSheet: (sheetId: string, name: string) => void;
  onSetSheetNotes: (sheetId: string, notes: string[]) => void;
  onAddCombinedSheet: () => void;
  onPlaceView: (sheetId: string, viewKind: SheetViewKind) => void;
};

export function WorkspaceSheetBrowser({
  project,
  activeSheetId,
  onSelectSheet,
  onRenameSheet,
  onSetSheetNotes,
  onAddCombinedSheet,
  onPlaceView,
}: WorkspaceSheetBrowserProps) {
  const sheetSet = useMemo(() => getProjectSheetSet(project), [project]);
  const active =
    sheetSet.sheets.find(
      (sheet) => sheet.id === activeSheetId || sheet.catalogId === activeSheetId,
    ) ?? sheetSet.sheets[0]!;
  const [notesDraft, setNotesDraft] = useState(active.notes.join("\n"));

  useEffect(() => {
    setNotesDraft(active.notes.join("\n"));
  }, [active.id, active.notes]);

  function selectSheet(sheet: SheetDocument) {
    onSelectSheet(sheet.id);
    setNotesDraft(sheet.notes.join("\n"));
  }

  return (
    <aside className="workspace-sheet-browser" aria-label="Sheet manager">
      <div className="workspace-sheet-browser-header">
        <span>Sheets</span>
        <button
          type="button"
          className="wsb-mini-btn"
          title="Add plan & elevation documentation sheet"
          onClick={onAddCombinedSheet}
        >
          + Combo
        </button>
      </div>
      <div className="wsb-list drawing-sheet-browser-list">
        {sheetSet.sheets.map((sheet) => {
          const selected = active.id === sheet.id;
          return (
            <button
              key={sheet.id}
              type="button"
              className={`wsb-item drawing-sheet-browser-item ${selected ? "is-active" : ""}`}
              onClick={() => selectSheet(sheet)}
              onDoubleClick={() => {
                const next = window.prompt("Sheet name", sheet.name);
                if (next) onRenameSheet(sheet.id, next);
              }}
              title={`${sheet.code} · ${sheet.scaleText} · double-click to rename`}
            >
              <span className="drawing-sheet-browser-code">{sheet.code}</span>
              <strong>{sheet.name}</strong>
              <small>
                {sheet.viewports.map((viewport) => viewport.viewKind).join(" · ")} ·{" "}
                {sheet.scaleText}
              </small>
            </button>
          );
        })}
      </div>

      <div className="workspace-sheet-browser-footer">
        <div className="wsb-place-row" aria-label="Place views on sheet">
          {PLACEABLE.map((item) => (
            <button
              key={item.kind}
              type="button"
              className="wsb-mini-btn"
              disabled={active.viewports.some(
                (viewport) => viewport.viewKind === item.kind,
              )}
              title={`Place ${item.label} view`}
              onClick={() => onPlaceView(active.id, item.kind)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="wsb-notes-label" htmlFor="sheet-doc-notes">
          Sheet notes
        </label>
        <textarea
          id="sheet-doc-notes"
          className="wsb-notes"
          rows={3}
          value={notesDraft}
          onChange={(event) => setNotesDraft(event.target.value)}
          onBlur={() =>
            onSetSheetNotes(
              active.id,
              notesDraft
                .split(/\n|;/)
                .map((line) => line.trim())
                .filter(Boolean),
            )
          }
          placeholder="Construction notes for this sheet…"
        />
      </div>
    </aside>
  );
}
