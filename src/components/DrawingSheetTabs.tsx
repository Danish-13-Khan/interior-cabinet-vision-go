import { useMemo } from "react";
import {
  getProjectSheetSet,
  type SheetDocument,
} from "../domain/sheetDocuments";
import type { CabinetProject } from "../domain/cabinetDimensions";

type DrawingSheetTabsProps = {
  project: CabinetProject;
  activeSheetId: string;
  onSelectSheet: (sheetId: string) => void;
};

function isActive(sheet: SheetDocument, activeSheetId: string) {
  return sheet.id === activeSheetId || sheet.catalogId === activeSheetId;
}

export function DrawingSheetTabs({
  project,
  activeSheetId,
  onSelectSheet,
}: DrawingSheetTabsProps) {
  const sheets = useMemo(() => getProjectSheetSet(project).sheets, [project]);

  return (
    <div className="drawing-sheet-tabs" role="tablist" aria-label="Drawing sheets">
      {sheets.map((sheet) => (
        <button
          key={sheet.id}
          type="button"
          role="tab"
          aria-selected={isActive(sheet, activeSheetId)}
          className={`drawing-sheet-tab ${isActive(sheet, activeSheetId) ? "is-active" : ""}`}
          title={`${sheet.code} · ${sheet.name} · ${sheet.scaleText}`}
          onClick={() => onSelectSheet(sheet.id)}
        >
          <span className="drawing-sheet-tab-code">{sheet.code}</span>
          <span className="drawing-sheet-tab-label">{sheet.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}
