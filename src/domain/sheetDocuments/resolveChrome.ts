import type { CabinetProject } from "../cabinetDimensions";
import { clampJobMeta, formatJobTitle } from "../jobMeta";
import {
  getDrawingSheet,
  normalizeDrawingSheetId,
  type DrawingSheetId,
  type DrawingSheetMeta,
} from "../drawingSheets";
import { clampProjectSheetSet, findSheetDocument } from "./clamp";
import { createDefaultProjectSheetSet, viewLabelForKind } from "./defaults";
import type { ProjectSheetSet, ResolvedSheetChrome, SheetViewKind } from "./types";

function primaryViewFromCatalog(
  technicalView: "top" | "front" | "side" | "section" | "detail" | undefined,
  sheetId: DrawingSheetId,
): SheetViewKind {
  if (technicalView) return technicalView;
  if (sheetId === "report") return "report";
  return "top";
}

export function getProjectSheetSet(project: CabinetProject): ProjectSheetSet {
  return clampProjectSheetSet(
    project.sheetSet,
    project.sheetSet?.activeSheetId ?? "plan",
  );
}

/** Single source of truth for sheet chrome across drafting, print, and PDF. */
export function resolveSheetChrome(
  sheetId: string,
  project?: CabinetProject | null,
): ResolvedSheetChrome {
  const sheetSet = project
    ? getProjectSheetSet(project)
    : createDefaultProjectSheetSet();
  const doc = findSheetDocument(sheetSet, sheetId);
  const job = project ? clampJobMeta(project.job) : null;

  if (doc) {
    return {
      sheetId: doc.id,
      code: doc.code,
      title: doc.name,
      shortLabel: doc.shortLabel,
      scaleText: doc.scaleText,
      viewLabel: viewLabelForKind(doc.primaryView),
      primaryView: doc.primaryView,
      includeNotesArea: doc.includeNotesArea,
      notes: doc.notes,
      revisionRows: doc.revisionRows,
      viewports: doc.viewports,
      projectName: job ? formatJobTitle(job) : undefined,
      revision: job?.revision || doc.revisionRows[0]?.revision,
    };
  }

  const catalogId = normalizeDrawingSheetId(sheetId);
  const catalog = getDrawingSheet(catalogId);
  const primaryView = primaryViewFromCatalog(catalog.technicalView, catalogId);
  return {
    sheetId: catalogId,
    code: catalog.code,
    title: catalog.title,
    shortLabel: catalog.shortLabel,
    scaleText: catalog.scaleText,
    viewLabel: viewLabelForKind(primaryView),
    primaryView,
    includeNotesArea: catalogId !== "report",
    notes: [],
    revisionRows: [],
    viewports: [],
    projectName: job ? formatJobTitle(job) : undefined,
    revision: job?.revision,
  };
}

export function sheetMetaFromChrome(
  chrome: ResolvedSheetChrome,
): DrawingSheetMeta {
  return {
    code: chrome.code,
    title: chrome.title,
    scaleText: chrome.scaleText,
    projectName: chrome.projectName,
    revision: chrome.revision,
  };
}

export function catalogIdFromSheetId(
  sheetId: string,
  project?: CabinetProject | null,
): DrawingSheetId {
  if (project) {
    const doc = findSheetDocument(getProjectSheetSet(project), sheetId);
    if (doc?.catalogId) return doc.catalogId;
    if (doc) return primaryViewToCatalog(doc.primaryView);
  }
  const set = createDefaultProjectSheetSet();
  const doc = findSheetDocument(set, sheetId);
  if (doc?.catalogId) return doc.catalogId;
  return normalizeDrawingSheetId(sheetId);
}

function primaryViewToCatalog(view: SheetViewKind): DrawingSheetId {
  switch (view) {
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
