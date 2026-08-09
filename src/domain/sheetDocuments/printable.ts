import type { DrawingSheetId } from "../drawingSheets";
import type { PrintSheetSpec } from "../printLayout/types";
import { viewLabelForKind } from "./defaults";
import type { ProjectSheetSet, SheetDocument, SheetViewKind } from "./types";

function noteViewFor(kind: SheetViewKind): PrintSheetSpec["noteView"] {
  if (kind === "top") return "top";
  if (kind === "front") return "front";
  if (kind === "side" || kind === "section" || kind === "detail") return "side";
  return "all";
}

function catalogIdForView(kind: SheetViewKind): DrawingSheetId {
  switch (kind) {
    case "front":
      return "front";
    case "side":
      return "side";
    case "section":
      return "section";
    case "detail":
      return "detail";
    case "report":
      return "report";
    default:
      return "plan";
  }
}

function technicalViewFor(kind: SheetViewKind): PrintSheetSpec["view"] {
  return kind === "top" ? "top" : kind;
}

/** Build printable sheet specs from the project sheet set (documentation order). */
export function printableSheetSpecsFromSet(
  sheetSet: ProjectSheetSet,
): PrintSheetSpec[] {
  return sheetSet.sheets.map((sheet) => ({
    sheetId: sheet.catalogId ?? catalogIdForView(sheet.primaryView),
    documentId: sheet.id,
    view: technicalViewFor(sheet.primaryView),
    noteView: noteViewFor(sheet.primaryView),
    viewLabel: viewLabelForKind(sheet.primaryView),
    includeNotesArea: sheet.includeNotesArea,
  }));
}

export function sheetDocumentNoteLines(sheet: SheetDocument): string[] {
  return sheet.notes.map((note) => note.trim()).filter(Boolean);
}
