import type { DrawingSheetId } from "../drawingSheets";

export type TitleBlockData = {
  projectName: string;
  sheetTitle: string;
  viewLabel: string;
  sheetCode: string;
  scaleText: string;
  projectNumber: string;
  customerName: string;
  revision: string;
  statusLabel: string;
  dateText: string;
  drawnBy: string;
  checkedBy: string;
  /** Secondary meta line (job subtitle, etc.) */
  metaLine: string;
};

export type PrintSheetSpec = {
  sheetId: DrawingSheetId;
  view: "top" | "front" | "side" | "section" | "detail" | "report";
  noteView: "top" | "front" | "side" | "all";
  viewLabel: string;
  includeNotesArea: boolean;
};

export type PrintLayoutMetrics = {
  pageWidthMm: number;
  pageHeightMm: number;
  marginMm: number;
  contentWidthMm: number;
  titleBlockHeightMm: number;
  notesAreaHeightMm: number;
  drawingMaxHeightMm: number;
};
