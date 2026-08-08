import type { CabinetProject } from "../cabinetDimensions";
import {
  createCabinetPlanningWorkflow,
  type CountertopSegment,
  type CabinetRun,
  type RunFiller,
} from "../cabinetLibrary";
import type { RoomConfig } from "../roomModel";
import type { ProjectReport } from "../projectReport";
import { getDrawingSheet, type DrawingSheetId } from "../drawingSheets";
import { createTechnicalView, svgToPngDataUrl } from "../technicalViews";
import { clampProjectDrafting } from "../draftingAnnotations";
import type { PdfLayout } from "./helpers";

const PDF_SHEETS: Array<{
  sheetId: DrawingSheetId;
  view: "top" | "front" | "side" | "section" | "detail" | "report";
  noteView: "top" | "front" | "side" | "all";
}> = [
  { sheetId: "plan", view: "top", noteView: "top" },
  { sheetId: "front", view: "front", noteView: "front" },
  { sheetId: "side", view: "side", noteView: "side" },
  { sheetId: "section", view: "section", noteView: "side" },
  { sheetId: "detail", view: "detail", noteView: "side" },
  { sheetId: "report", view: "report", noteView: "all" },
];

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
  const { title, project, room, countertops, runs, report } = args;
  const fillers =
    args.fillers ??
    createCabinetPlanningWorkflow(project, {
      widthMm: room.dimensions.widthMm,
      depthMm: room.dimensions.depthMm,
      heightMm: room.dimensions.heightMm,
    }).fillers;

  const drafting = clampProjectDrafting(project.drafting);
  const shared = {
    mode: "print" as const,
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

  for (const page of PDF_SHEETS) {
    const sheet = getDrawingSheet(page.sheetId);
    const result = createTechnicalView(project, room, page.view, countertops, {
      ...shared,
      title: sheet.title,
      sheetCode: sheet.code,
    });

    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    let viewY = margin;

    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.4);
    doc.rect(margin, viewY, contentWidth, 16);
    doc.line(margin + contentWidth * 0.55, viewY, margin + contentWidth * 0.55, viewY + 16);
    doc.line(margin + contentWidth * 0.78, viewY, margin + contentWidth * 0.78, viewY + 16);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin + 3, viewY + 6.5);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(sheet.title, margin + 3, viewY + 12.5);
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(sheet.code, margin + contentWidth * 0.55 + 3, viewY + 6.5);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(sheet.scaleText, margin + contentWidth * 0.55 + 3, viewY + 12.5);
    doc.text("TECHNICAL", margin + contentWidth * 0.78 + 3, viewY + 6.5);
    doc.text(
      `Rev ${report.summary.revision}`,
      margin + contentWidth * 0.78 + 3,
      viewY + 12.5,
    );
    viewY += 22;

    const viewImage = await svgToPngDataUrl(result.svg);
    const scale = Math.min(contentWidth / result.width, 175 / result.height);
    const drawWidth = result.width * scale;
    const drawHeight = result.height * scale;

    doc.setDrawColor(148, 163, 184);
    doc.rect(margin, viewY, contentWidth, drawHeight + 8);
    doc.addImage(
      viewImage,
      "PNG",
      margin + (contentWidth - drawWidth) / 2,
      viewY + 4,
      drawWidth,
      drawHeight,
    );

    if (page.sheetId === "report" || page.sheetId === "detail") continue;

    viewY += drawHeight + 14;
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("Revision / Site Notes", margin, viewY);
    viewY += 3;
    doc.setDrawColor(148, 163, 184);
    doc.rect(margin, viewY, contentWidth, 36);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const sheetNotes = drafting.notes
      .filter(
        (note) => note.view === "all" || note.view === page.noteView,
      )
      .map((note) => note.text);
    const leaderNotes = drafting.leaders
      .filter(
        (leader) => leader.view === "all" || leader.view === page.noteView,
      )
      .map((leader) => leader.text);
    const seeded = [...sheetNotes, ...leaderNotes].slice(0, 4);
    if (seeded.length === 0) {
      doc.text(
        "Mark clearances, appliance models, filler decisions, and approval initials.",
        margin + 3,
        viewY + 7,
      );
    } else {
      seeded.forEach((line, index) => {
        doc.text(`• ${line}`, margin + 3, viewY + 7 + index * 7);
      });
    }
  }
}
