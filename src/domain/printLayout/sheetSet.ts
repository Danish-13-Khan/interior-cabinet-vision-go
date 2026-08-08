import type { PrintSheetSpec } from "./types";

/** Canonical printable multi-sheet layout set for PDF / print fidelity. */
export const PRINTABLE_SHEET_SET: readonly PrintSheetSpec[] = [
  {
    sheetId: "plan",
    view: "top",
    noteView: "top",
    viewLabel: "PLAN",
    includeNotesArea: true,
  },
  {
    sheetId: "front",
    view: "front",
    noteView: "front",
    viewLabel: "FRONT ELEV.",
    includeNotesArea: true,
  },
  {
    sheetId: "side",
    view: "side",
    noteView: "side",
    viewLabel: "SIDE ELEV.",
    includeNotesArea: true,
  },
  {
    sheetId: "section",
    view: "section",
    noteView: "side",
    viewLabel: "SECTION",
    includeNotesArea: true,
  },
  {
    sheetId: "detail",
    view: "detail",
    noteView: "side",
    viewLabel: "DETAIL",
    includeNotesArea: true,
  },
  {
    sheetId: "report",
    view: "report",
    noteView: "all",
    viewLabel: "REPORT",
    includeNotesArea: false,
  },
] as const;

export function printableSheetIds() {
  return PRINTABLE_SHEET_SET.map((sheet) => sheet.sheetId);
}
