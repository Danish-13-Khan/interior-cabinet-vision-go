import { DRAWING_SHEETS, type DrawingSheetId } from "../drawingSheets";
import type {
  ProjectSheetSet,
  SheetDocument,
  SheetRevisionRow,
  SheetViewKind,
  SheetViewport,
} from "./types";

const VIEW_LABELS: Record<SheetViewKind, string> = {
  top: "PLAN",
  front: "FRONT ELEV.",
  side: "SIDE ELEV.",
  section: "SECTION",
  detail: "DETAIL",
  report: "REPORT",
};

function catalogView(id: DrawingSheetId): SheetViewKind {
  switch (id) {
    case "plan":
      return "top";
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
  }
}

function fullPageViewport(
  viewKind: SheetViewKind,
  title: string,
  scaleText: string,
): SheetViewport {
  return {
    id: `vp-${viewKind}`,
    viewKind,
    title,
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    scaleText,
  };
}

function defaultRevisionRows(revision = "A"): SheetRevisionRow[] {
  return [
    {
      id: "rev-1",
      revision,
      date: new Date().toLocaleDateString(),
      description: "Issued for construction",
      by: "Designer",
    },
  ];
}

/** Seed the project sheet set from the fixed drawing catalog. */
export function createDefaultSheetDocuments(
  revision = "A",
): SheetDocument[] {
  return DRAWING_SHEETS.map((sheet) => {
    const primaryView = catalogView(sheet.id);
    return {
      id: sheet.id,
      catalogId: sheet.id,
      code: sheet.code,
      name: sheet.title,
      shortLabel: sheet.shortLabel,
      scaleText: sheet.scaleText,
      group: sheet.group,
      primaryView,
      viewports: [fullPageViewport(primaryView, sheet.title, sheet.scaleText)],
      notes: [],
      revisionRows: defaultRevisionRows(revision),
      includeNotesArea: sheet.id !== "report",
      pageSize: "A4" as const,
    };
  });
}

export function createDefaultProjectSheetSet(
  revision = "A",
  activeSheetId: string = "plan",
): ProjectSheetSet {
  const sheets = createDefaultSheetDocuments(revision);
  return {
    sheets,
    activeSheetId: sheets.some((sheet) => sheet.id === activeSheetId)
      ? activeSheetId
      : sheets[0]!.id,
  };
}

export function viewLabelForKind(kind: SheetViewKind) {
  return VIEW_LABELS[kind];
}

/** Compose a multi-view documentation sheet (plan + elevation). */
export function createCombinedPlanElevationSheet(
  index: number,
): SheetDocument {
  const code = `A-${600 + index}`;
  return {
    id: `custom-plan-elev-${index}`,
    code,
    name: "Plan & Elevation",
    shortLabel: "Combo",
    scaleText: DRAWING_SHEETS[0]!.scaleText,
    group: "custom",
    primaryView: "top",
    viewports: [
      {
        id: "vp-plan",
        viewKind: "top",
        title: "Plan",
        x: 0,
        y: 0,
        width: 0.55,
        height: 1,
        scaleText: DRAWING_SHEETS[0]!.scaleText,
      },
      {
        id: "vp-front",
        viewKind: "front",
        title: "Front Elevation",
        x: 0.57,
        y: 0,
        width: 0.43,
        height: 1,
        scaleText: DRAWING_SHEETS[1]!.scaleText,
      },
    ],
    notes: ["Combined documentation sheet — views placed for issue."],
    revisionRows: defaultRevisionRows(),
    includeNotesArea: true,
    pageSize: "A3",
  };
}
