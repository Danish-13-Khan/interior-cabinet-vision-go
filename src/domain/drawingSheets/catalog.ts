import { TECHNICAL_VIEW_SCALE } from "../technicalViews/constants";
import type { DrawingSheetDef, DrawingSheetId } from "./types";

const SCALE_TEXT = `1:${TECHNICAL_VIEW_SCALE * 25}`;
const DETAIL_SCALE_TEXT = `1:${Math.round((TECHNICAL_VIEW_SCALE * 25) / 2.2)}`;

export const DRAWING_SHEETS: readonly DrawingSheetDef[] = [
  {
    id: "plan",
    code: "A-101",
    title: "Room Plan",
    shortLabel: "Plan",
    scaleText: SCALE_TEXT,
    group: "plan",
    technicalView: "top",
    workspaceTab: "plan",
  },
  {
    id: "front",
    code: "A-201",
    title: "Front Elevation",
    shortLabel: "Front",
    scaleText: SCALE_TEXT,
    group: "elevation",
    technicalView: "front",
    workspaceTab: "front",
  },
  {
    id: "side",
    code: "A-202",
    title: "Side Elevation",
    shortLabel: "Side",
    scaleText: SCALE_TEXT,
    group: "elevation",
    technicalView: "side",
    workspaceTab: "side",
  },
  {
    id: "section",
    code: "A-301",
    title: "Section A-A",
    shortLabel: "Section",
    scaleText: SCALE_TEXT,
    group: "section",
    technicalView: "section",
  },
  {
    id: "detail",
    code: "A-501",
    title: "Cabinet Detail DET-1",
    shortLabel: "Detail",
    scaleText: DETAIL_SCALE_TEXT,
    group: "detail",
    technicalView: "detail",
  },
  {
    id: "report",
    code: "A-401",
    title: "Cabinet Schedule",
    shortLabel: "Report",
    scaleText: "NTS",
    group: "schedule",
  },
] as const;

export function getDrawingSheet(id: DrawingSheetId): DrawingSheetDef {
  return DRAWING_SHEETS.find((sheet) => sheet.id === id) ?? DRAWING_SHEETS[0]!;
}

export function normalizeDrawingSheetId(value: unknown): DrawingSheetId {
  if (
    value === "plan" ||
    value === "front" ||
    value === "side" ||
    value === "section" ||
    value === "detail" ||
    value === "report"
  ) {
    return value;
  }
  return "plan";
}

export function drawingSheetFromWorkspaceTab(
  tab: "plan" | "front" | "side" | "3d",
): DrawingSheetId | null {
  if (tab === "plan" || tab === "front" || tab === "side") return tab;
  return null;
}

export function scaleTextForSheet(id: DrawingSheetId) {
  return getDrawingSheet(id).scaleText;
}
