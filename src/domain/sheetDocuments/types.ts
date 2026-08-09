import type { DrawingSheetId } from "../drawingSheets";

export type SheetViewKind =
  | "top"
  | "front"
  | "side"
  | "section"
  | "detail"
  | "report";

export type SheetViewport = {
  id: string;
  viewKind: SheetViewKind;
  title: string;
  /** Normalized drawing-area rect (0–1). */
  x: number;
  y: number;
  width: number;
  height: number;
  scaleText?: string;
};

export type SheetRevisionRow = {
  id: string;
  revision: string;
  date: string;
  description: string;
  by: string;
};

export type SheetDocument = {
  id: string;
  /** Stable link to catalog sheet when seeded from defaults. */
  catalogId?: DrawingSheetId;
  code: string;
  name: string;
  shortLabel: string;
  scaleText: string;
  group: "plan" | "elevation" | "section" | "detail" | "schedule" | "custom";
  primaryView: SheetViewKind;
  viewports: SheetViewport[];
  notes: string[];
  revisionRows: SheetRevisionRow[];
  includeNotesArea: boolean;
  pageSize: "A4" | "A3";
};

export type ProjectSheetSet = {
  sheets: SheetDocument[];
  activeSheetId: string;
};

export type ResolvedSheetChrome = {
  sheetId: string;
  code: string;
  title: string;
  shortLabel: string;
  scaleText: string;
  viewLabel: string;
  primaryView: SheetViewKind;
  includeNotesArea: boolean;
  notes: string[];
  revisionRows: SheetRevisionRow[];
  viewports: SheetViewport[];
  projectName?: string;
  revision?: string;
};
