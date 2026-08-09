import { createCombinedPlanElevationSheet, viewLabelForKind } from "./defaults";
import { clampProjectSheetSet, findSheetDocument } from "./clamp";
import type { ProjectSheetSet, SheetDocument, SheetViewKind, SheetViewport } from "./types";

function tileViewports(viewports: SheetViewport[]): SheetViewport[] {
  const count = viewports.length;
  if (count <= 1) {
    return viewports.map((viewport) => ({
      ...viewport,
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    }));
  }
  if (count === 2) {
    return viewports.map((viewport, index) => ({
      ...viewport,
      x: index === 0 ? 0 : 0.52,
      y: 0,
      width: index === 0 ? 0.5 : 0.48,
      height: 1,
    }));
  }
  const cols = count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);
  const gap = 0.02;
  const cellW = (1 - gap * (cols - 1)) / cols;
  const cellH = (1 - gap * (rows - 1)) / rows;
  return viewports.map((viewport, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      ...viewport,
      x: col * (cellW + gap),
      y: row * (cellH + gap),
      width: cellW,
      height: cellH,
    };
  });
}

/** Place an additional plan/elevation/section/detail viewport on a sheet. */
export function placeViewOnSheet(
  sheetSet: ProjectSheetSet,
  sheetId: string,
  viewKind: SheetViewKind,
): ProjectSheetSet {
  if (viewKind === "report") return sheetSet;
  const target = findSheetDocument(sheetSet, sheetId);
  if (!target) return sheetSet;
  if (target.viewports.some((viewport) => viewport.viewKind === viewKind)) {
    return sheetSet;
  }
  const nextViewport: SheetViewport = {
    id: `vp-${viewKind}-${target.viewports.length + 1}`,
    viewKind,
    title: viewLabelForKind(viewKind),
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    scaleText: target.scaleText,
  };
  return {
    ...sheetSet,
    sheets: sheetSet.sheets.map((sheet) =>
      sheet.id === target.id
        ? {
            ...sheet,
            viewports: tileViewports([...sheet.viewports, nextViewport]),
            group:
              sheet.viewports.length + 1 > 1 ? "custom" : sheet.group,
            pageSize:
              sheet.viewports.length + 1 > 1 ? "A3" : sheet.pageSize,
          }
        : sheet,
    ),
  };
}

export function renameSheetDocument(
  sheetSet: ProjectSheetSet,
  sheetId: string,
  name: string,
): ProjectSheetSet {
  const nextName = name.trim();
  if (!nextName) return sheetSet;
  return {
    ...sheetSet,
    sheets: sheetSet.sheets.map((sheet) =>
      sheet.id === sheetId || sheet.catalogId === sheetId
        ? {
            ...sheet,
            name: nextName,
            shortLabel:
              nextName.length > 10 ? `${nextName.slice(0, 9)}…` : nextName,
          }
        : sheet,
    ),
  };
}

export function setSheetDocumentNotes(
  sheetSet: ProjectSheetSet,
  sheetId: string,
  notes: string[],
): ProjectSheetSet {
  return {
    ...sheetSet,
    sheets: sheetSet.sheets.map((sheet) =>
      sheet.id === sheetId || sheet.catalogId === sheetId
        ? {
            ...sheet,
            notes: notes.map((note) => note.trim()).filter(Boolean).slice(0, 12),
          }
        : sheet,
    ),
  };
}

export function addCombinedDocumentationSheet(
  sheetSet: ProjectSheetSet,
): ProjectSheetSet {
  const customCount =
    sheetSet.sheets.filter((sheet) => sheet.group === "custom").length + 1;
  const next = createCombinedPlanElevationSheet(customCount);
  return clampProjectSheetSet({
    sheets: [...sheetSet.sheets, next],
    activeSheetId: next.id,
  });
}

export function setActiveSheetDocument(
  sheetSet: ProjectSheetSet,
  sheetId: string,
): ProjectSheetSet {
  const target = findSheetDocument(sheetSet, sheetId);
  if (!target) return sheetSet;
  return { ...sheetSet, activeSheetId: target.id };
}

export function updateSheetViewports(
  sheetSet: ProjectSheetSet,
  sheetId: string,
  viewports: SheetDocument["viewports"],
): ProjectSheetSet {
  return {
    ...sheetSet,
    sheets: sheetSet.sheets.map((sheet) =>
      sheet.id === sheetId || sheet.catalogId === sheetId
        ? { ...sheet, viewports }
        : sheet,
    ),
  };
}
