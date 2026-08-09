import type { DrawingSheetId } from "../drawingSheets";
import { normalizeDrawingSheetId } from "../drawingSheets";
import {
  createDefaultProjectSheetSet,
  viewLabelForKind,
} from "./defaults";
import type {
  ProjectSheetSet,
  SheetDocument,
  SheetRevisionRow,
  SheetViewKind,
  SheetViewport,
} from "./types";

const VIEW_KINDS: SheetViewKind[] = [
  "top",
  "front",
  "side",
  "section",
  "detail",
  "report",
];

function clampViewport(raw: Partial<SheetViewport>, index: number): SheetViewport {
  const viewKind = VIEW_KINDS.includes(raw.viewKind as SheetViewKind)
    ? (raw.viewKind as SheetViewKind)
    : "top";
  const width = Math.min(1, Math.max(0.15, Number(raw.width) || 1));
  const height = Math.min(1, Math.max(0.15, Number(raw.height) || 1));
  const x = Math.min(1 - width, Math.max(0, Number(raw.x) || 0));
  const y = Math.min(1 - height, Math.max(0, Number(raw.y) || 0));
  return {
    id: raw.id?.trim() || `vp-${index + 1}`,
    viewKind,
    title: raw.title?.trim() || viewLabelForKind(viewKind),
    x,
    y,
    width,
    height,
    scaleText: raw.scaleText?.trim() || undefined,
  };
}

function clampRevisionRow(
  raw: Partial<SheetRevisionRow>,
  index: number,
): SheetRevisionRow {
  return {
    id: raw.id?.trim() || `rev-${index + 1}`,
    revision: raw.revision?.trim() || "A",
    date: raw.date?.trim() || new Date().toLocaleDateString(),
    description: raw.description?.trim() || "Revision",
    by: raw.by?.trim() || "—",
  };
}

function clampSheetDocument(
  raw: Partial<SheetDocument>,
  index: number,
  fallback: SheetDocument,
): SheetDocument {
  const catalogId =
    raw.catalogId &&
    ["plan", "front", "side", "section", "detail", "report"].includes(raw.catalogId)
      ? (raw.catalogId as DrawingSheetId)
      : fallback.catalogId;

  const primaryView = VIEW_KINDS.includes(raw.primaryView as SheetViewKind)
    ? (raw.primaryView as SheetViewKind)
    : fallback.primaryView;

  const viewports =
    Array.isArray(raw.viewports) && raw.viewports.length > 0
      ? raw.viewports.map((viewport, vpIndex) => clampViewport(viewport, vpIndex))
      : fallback.viewports;

  return {
    id: raw.id?.trim() || fallback.id || `sheet-${index + 1}`,
    catalogId,
    code: raw.code?.trim() || fallback.code,
    name: raw.name?.trim() || fallback.name,
    shortLabel: raw.shortLabel?.trim() || fallback.shortLabel,
    scaleText: raw.scaleText?.trim() || fallback.scaleText,
    group: raw.group ?? fallback.group,
    primaryView,
    viewports,
    notes: Array.isArray(raw.notes)
      ? raw.notes.map((note) => String(note).trim()).filter(Boolean).slice(0, 12)
      : fallback.notes,
    revisionRows:
      Array.isArray(raw.revisionRows) && raw.revisionRows.length > 0
        ? raw.revisionRows.map((row, rowIndex) => clampRevisionRow(row, rowIndex))
        : fallback.revisionRows,
    includeNotesArea:
      typeof raw.includeNotesArea === "boolean"
        ? raw.includeNotesArea
        : fallback.includeNotesArea,
    pageSize: raw.pageSize === "A3" ? "A3" : "A4",
  };
}

export function clampProjectSheetSet(
  value: Partial<ProjectSheetSet> | undefined,
  activeFallback: string = "plan",
): ProjectSheetSet {
  const defaults = createDefaultProjectSheetSet("A", activeFallback);
  if (!value || !Array.isArray(value.sheets) || value.sheets.length === 0) {
    return defaults;
  }

  const sheets = value.sheets.map((sheet, index) =>
    clampSheetDocument(sheet, index, defaults.sheets[Math.min(index, defaults.sheets.length - 1)]!),
  );

  // Ensure core catalog sheets exist so drafting tabs keep working.
  for (const seed of defaults.sheets) {
    if (!sheets.some((sheet) => sheet.catalogId === seed.catalogId || sheet.id === seed.id)) {
      sheets.push(seed);
    }
  }

  const activeSheetId =
    sheets.find((sheet) => sheet.id === value.activeSheetId)?.id ??
    sheets.find((sheet) => sheet.catalogId === normalizeDrawingSheetId(activeFallback))?.id ??
    sheets[0]!.id;

  return { sheets, activeSheetId };
}

export function findSheetDocument(
  sheetSet: ProjectSheetSet,
  sheetId: string,
): SheetDocument | null {
  return (
    sheetSet.sheets.find((sheet) => sheet.id === sheetId) ??
    sheetSet.sheets.find((sheet) => sheet.catalogId === sheetId) ??
    null
  );
}
