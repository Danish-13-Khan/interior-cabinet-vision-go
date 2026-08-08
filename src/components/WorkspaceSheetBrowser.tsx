import {
  DRAWING_SHEETS,
  type DrawingSheetId,
} from "../domain/drawingSheets";

type WorkspaceSheetBrowserProps = {
  activeSheetId: DrawingSheetId;
  onSelectSheet: (sheetId: DrawingSheetId) => void;
};

export function WorkspaceSheetBrowser({
  activeSheetId,
  onSelectSheet,
}: WorkspaceSheetBrowserProps) {
  return (
    <aside className="workspace-sheet-browser" aria-label="Sheet browser">
      <div className="workspace-sheet-browser-header">Sheets</div>
      <div className="wsb-list drawing-sheet-browser-list">
        {DRAWING_SHEETS.map((sheet) => {
          const active = activeSheetId === sheet.id;
          return (
            <button
              key={sheet.id}
              type="button"
              className={`wsb-item drawing-sheet-browser-item ${active ? "is-active" : ""}`}
              onClick={() => onSelectSheet(sheet.id)}
              title={`${sheet.code} · ${sheet.scaleText}`}
            >
              <span className="drawing-sheet-browser-code">{sheet.code}</span>
              <strong>{sheet.title}</strong>
              <small>
                {sheet.shortLabel} · {sheet.scaleText}
              </small>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
