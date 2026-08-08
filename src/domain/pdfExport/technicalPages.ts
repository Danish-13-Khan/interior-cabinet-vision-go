import type { CabinetProject } from "../cabinetDimensions";
import type { CountertopSegment, CabinetRun } from "../cabinetLibrary";
import type { RoomConfig } from "../roomModel";
import type { ProjectReport } from "../projectReport";
import {
  createTechnicalView,
  svgToPngDataUrl,
  TECHNICAL_VIEW_SCALE,
} from "../technicalViews";
import { clampProjectDrafting } from "../draftingAnnotations";
import type { PdfLayout } from "./helpers";

export async function drawTechnicalPages(
  layout: PdfLayout,
  args: {
    title: string;
    project: CabinetProject;
    room: RoomConfig;
    countertops: CountertopSegment[];
    runs: CabinetRun[];
    report: ProjectReport;
  },
): Promise<void> {
  const { doc, pageWidth, pageHeight, margin, contentWidth } = layout;
  const { title, project, room, countertops, runs, report } = args;

  const drafting = clampProjectDrafting(project.drafting);
  const scaleText = `1:${TECHNICAL_VIEW_SCALE * 25}`;
  const topView = createTechnicalView(project, room, "top", countertops, {
    mode: "print",
    showGrid: false,
    showDimensionChains: true,
    showWallLabels: true,
    showElevationDetails: true,
    showCabinetTags: true,
    showOpeningTags: true,
    showApplianceTags: true,
    title: "Room Plan",
    projectName: title,
    runs,
    drafting,
  });
  const frontView = createTechnicalView(project, room, "front", countertops, {
    mode: "print",
    showDimensionChains: true,
    showWallLabels: true,
    showElevationDetails: true,
    showCabinetTags: true,
    showOpeningTags: true,
    showApplianceTags: true,
    title: "Front Elevation",
    projectName: title,
    drafting,
  });
  const sideView = createTechnicalView(project, room, "side", countertops, {
    mode: "print",
    showDimensionChains: true,
    showWallLabels: true,
    showElevationDetails: true,
    showCabinetTags: true,
    showOpeningTags: true,
    showApplianceTags: true,
    title: "Side Elevation",
    projectName: title,
    drafting,
  });
  const technicalViews = [
    { label: "Room Plan", result: topView, sheetCode: "A-101" },
    { label: "Front Elevation", result: frontView, sheetCode: "A-201" },
    { label: "Side Elevation", result: sideView, sheetCode: "A-202" },
  ];

  for (const view of technicalViews) {
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
    doc.text(view.label, margin + 3, viewY + 12.5);
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(view.sheetCode, margin + contentWidth * 0.55 + 3, viewY + 6.5);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(scaleText, margin + contentWidth * 0.55 + 3, viewY + 12.5);
    doc.text("TECHNICAL", margin + contentWidth * 0.78 + 3, viewY + 6.5);
    doc.text(
      `Rev ${report.summary.revision}`,
      margin + contentWidth * 0.78 + 3,
      viewY + 12.5,
    );
    viewY += 22;

    const viewImage = await svgToPngDataUrl(view.result.svg);
    const scale = Math.min(contentWidth / view.result.width, 175 / view.result.height);
    const drawWidth = view.result.width * scale;
    const drawHeight = view.result.height * scale;

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
      .filter((note) => note.view === "all" || note.view === (view.label.includes("Plan") ? "top" : view.label.includes("Front") ? "front" : "side"))
      .map((note) => note.text);
    const leaderNotes = drafting.leaders
      .filter((leader) => leader.view === "all" || leader.view === (view.label.includes("Plan") ? "top" : view.label.includes("Front") ? "front" : "side"))
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
