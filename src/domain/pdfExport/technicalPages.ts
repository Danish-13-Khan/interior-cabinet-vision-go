import type { CabinetProject } from "../cabinetDimensions";
import {
  createCabinetPlanningWorkflow,
  type CountertopSegment,
  type CabinetRun,
  type RunFiller,
} from "../cabinetLibrary";
import type { RoomConfig } from "../roomModel";
import type { ProjectReport } from "../projectReport";
import {
  getProjectSheetSet,
  printableSheetSpecsFromSet,
  resolveSheetChrome,
} from "../sheetDocuments";
import { createTechnicalView, svgToPngDataUrl } from "../technicalViews";
import { clampProjectDrafting } from "../draftingAnnotations";
import { clampJobMeta } from "../jobMeta";
import {
  A4_PRINT_METRICS,
  PRINTABLE_SHEET_SET,
  buildTitleBlockData,
  collectPrintNoteLines,
  drawPdfInfoAndNotes,
  drawPdfTitleBlock,
  fitDrawingToContent,
} from "../printLayout";
import type { PdfLayout } from "./helpers";

export async function drawTechnicalPages(
  layout: PdfLayout,
  args: {
    title: string;
    project: CabinetProject;
    room: RoomConfig;
    countertops: CountertopSegment[];
    runs: CabinetRun[];
    fillers?: RunFiller[];
    report: ProjectReport;
  },
): Promise<void> {
  const { doc, pageWidth, pageHeight, margin, contentWidth } = layout;
  const { title, project, room, countertops, runs } = args;
  const fillers =
    args.fillers ??
    createCabinetPlanningWorkflow(project, {
      widthMm: room.dimensions.widthMm,
      depthMm: room.dimensions.depthMm,
      heightMm: room.dimensions.heightMm,
    }).fillers;

  const drafting = clampProjectDrafting(project.drafting);
  const job = clampJobMeta(project.job);
  const sheetSet = getProjectSheetSet(project);
  const pages =
    printableSheetSpecsFromSet(sheetSet).length > 0
      ? printableSheetSpecsFromSet(sheetSet)
      : [...PRINTABLE_SHEET_SET];

  const shared = {
    mode: "print" as const,
    embedSheetChrome: false,
    showGrid: false,
    showDimensionChains: true,
    showWallLabels: true,
    showElevationDetails: true,
    showCabinetTags: true,
    showOpeningTags: true,
    showApplianceTags: true,
    showRunBands: true,
    showRunLabels: true,
    showFillers: true,
    showCountertopSpans: true,
    projectName: title,
    runs,
    fillers,
    countertops,
    drafting,
  };

  for (const page of pages) {
    const chrome = resolveSheetChrome(page.documentId ?? page.sheetId, project);
    const result = createTechnicalView(project, room, page.view, countertops, {
      ...shared,
      title: chrome.title,
      sheetCode: chrome.code,
    });

    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    const titleData = buildTitleBlockData({
      project,
      options: {
        ...shared,
        title: chrome.title,
        sheetCode: chrome.code,
      },
      sheetTitle: chrome.title,
      viewLabel: page.viewLabel || chrome.viewLabel,
      scaleText: chrome.scaleText,
      sheetCode: chrome.code,
    });

    let viewY = drawPdfTitleBlock(layout, margin, titleData);

    const { drawWidth, drawHeight } = fitDrawingToContent(
      result.width,
      result.height,
      contentWidth,
      A4_PRINT_METRICS.drawingMaxHeightMm,
    );
    const viewImage = await svgToPngDataUrl(result.svg);

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.rect(margin, viewY, contentWidth, drawHeight + 6);
    doc.addImage(
      viewImage,
      "PNG",
      margin + (contentWidth - drawWidth) / 2,
      viewY + 3,
      drawWidth,
      drawHeight,
    );
    viewY += drawHeight + 10;

    if (!page.includeNotesArea) continue;

    const notes = [
      ...chrome.notes,
      ...collectPrintNoteLines(drafting, page.noteView, job.notes),
    ].slice(0, 6);
    drawPdfInfoAndNotes(layout, viewY, titleData, notes);
  }
}
