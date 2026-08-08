import {
  DRAWING_SHEETS,
  type DrawingSheetId,
} from "../domain/drawingSheets";

type DrawingSheetTabsProps = {
  activeSheetId: DrawingSheetId;
  onSelectSheet: (sheetId: DrawingSheetId) => void;
};

export function DrawingSheetTabs({
  activeSheetId,
  onSelectSheet,
}: DrawingSheetTabsProps) {
  return (
    <div className="drawing-sheet-tabs" role="tablist" aria-label="Drawing sheets">
      {DRAWING_SHEETS.map((sheet) => (
        <button
          key={sheet.id}
          type="button"
          role="tab"
          aria-selected={activeSheetId === sheet.id}
          className={`drawing-sheet-tab ${activeSheetId === sheet.id ? "is-active" : ""}`}
          title={`${sheet.code} · ${sheet.title} · ${sheet.scaleText}`}
          onClick={() => onSelectSheet(sheet.id)}
        >
          <span className="drawing-sheet-tab-code">{sheet.code}</span>
          <span className="drawing-sheet-tab-label">{sheet.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}
