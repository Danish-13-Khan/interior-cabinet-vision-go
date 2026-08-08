import { formatJobSubtitle, JOB_STATUS_LABELS, type ProjectJobMeta } from "../jobMeta";
import { formatProjectTechnicalSummary } from "../technicalViews";
import type { CabinetProject } from "../cabinetDimensions";
import type { RoomConfig } from "../roomModel";
import type { ProjectReport } from "../projectReport";
import { drawLabeledValue, ensurePageSpace, type PdfLayout } from "./helpers";

export function drawCoverSection(
  layout: PdfLayout,
  y: number,
  args: {
    title: string;
    job: ProjectJobMeta;
    project: CabinetProject;
    room: RoomConfig;
    report: ProjectReport;
    optimizedImage: string | null;
  },
): number {
  const { doc, pageWidth, pageHeight, margin, contentWidth, rowHeight } = layout;
  const { title, job, project, room, report, optimizedImage } = args;

  doc.setFillColor(247, 248, 250);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFontSize(18);
  doc.setTextColor(34, 44, 59);
  doc.text("Production Packet", margin, y);
  y += 7;

  doc.setFontSize(14);
  doc.text(title, margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(104, 116, 132);
  doc.text(
    `${formatJobSubtitle(job)}  ·  Exported ${new Date().toLocaleString()}  ·  ${project.cabinets.length} items`,
    margin,
    y,
  );
  y += 8;

  const summaryCardWidth = (contentWidth - 12) / 4;
  drawLabeledValue(doc, margin, y, summaryCardWidth, "Project #", report.summary.projectNumber);
  drawLabeledValue(
    doc,
    margin + summaryCardWidth + 4,
    y,
    summaryCardWidth,
    "Customer",
    report.summary.customerName,
  );
  drawLabeledValue(
    doc,
    margin + (summaryCardWidth + 4) * 2,
    y,
    summaryCardWidth,
    "Status",
    JOB_STATUS_LABELS[job.status],
  );
  drawLabeledValue(
    doc,
    margin + (summaryCardWidth + 4) * 3,
    y,
    summaryCardWidth,
    "Revision",
    report.summary.revision,
  );
  y += 19;

  const secondRowWidth = (contentWidth - 8) / 3;
  drawLabeledValue(doc, margin, y, secondRowWidth, "Cabinets", String(report.summary.cabinetCount));
  drawLabeledValue(
    doc,
    margin + secondRowWidth + 4,
    y,
    secondRowWidth,
    "Runs",
    String(report.summary.runCount),
  );
  drawLabeledValue(
    doc,
    margin + (secondRowWidth + 4) * 2,
    y,
    secondRowWidth,
    "Room Size",
    report.summary.roomSizeLabel,
  );
  y += 21;

  if (optimizedImage) {
    const imageHeight = 84;
    const imageWidth = contentWidth;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, imageWidth, imageHeight, 3, 3, "F");
    doc.setDrawColor(225, 230, 236);
    doc.roundedRect(margin, y, imageWidth, imageHeight, 3, 3);
    doc.addImage(optimizedImage, "JPEG", margin + 2, y + 2, imageWidth - 4, imageHeight - 4);
    doc.setFontSize(8);
    doc.setTextColor(113, 123, 137);
    doc.text("3D scene preview", margin + 2, y + imageHeight - 3);
  y += imageHeight + 8;
  }

  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Project Summary", margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(84, 96, 113);
  for (const line of formatProjectTechnicalSummary(project, room)) {
    doc.text(line, margin, y);
    y += 5;
  }
  y += 2;

  if (job.notes) {
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(`Notes: ${job.notes}`, contentWidth);
    for (const line of noteLines.slice(0, 4)) {
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 2;
  }

  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Cabinet Schedule", margin, y);
  y += 6;

  const headers = ["Mark", "Name", "Type", "W", "H", "D", "Run"];
  const colWidths = [16, 42, 30, 14, 14, 14, 42];
  const tableWidth = colWidths.reduce((total, value) => total + value, 0);

  doc.setFillColor(232, 237, 243);
  doc.rect(margin, y, tableWidth, rowHeight, "F");
  doc.setFontSize(8);
  doc.setTextColor(65, 76, 91);
  let currentX = margin;
  headers.forEach((header, index) => {
    doc.text(header, currentX + 1.3, y + rowHeight - 2.1);
    currentX += colWidths[index];
  });
  y += rowHeight;

  doc.setTextColor(40, 50, 65);
  report.cabinetSchedule.forEach((cabinet, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, tableWidth, rowHeight, "F");
    }

    const runLabel = cabinet.runLabel ?? "—";
    const row = [
      cabinet.mark,
      cabinet.cabinetName.length > 20
        ? `${cabinet.cabinetName.slice(0, 19)}…`
        : cabinet.cabinetName,
      cabinet.typeLabel.length > 14 ? `${cabinet.typeLabel.slice(0, 13)}…` : cabinet.typeLabel,
      String(cabinet.widthMm),
      String(cabinet.heightMm),
      String(cabinet.depthMm),
      runLabel.length > 22 ? `${runLabel.slice(0, 21)}…` : runLabel,
    ];

    currentX = margin;
    row.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += colWidths[cellIndex];
    });
    y += rowHeight;
  });

  if (report.runSummaries.length > 0) {
    y = ensurePageSpace(doc, y + 8, 24, pageHeight, margin);
    doc.setFontSize(13);
    doc.setTextColor(34, 44, 59);
    doc.text("Room / Run Summary", margin, y);
    y += 6;

    for (const run of report.runSummaries) {
      y = ensurePageSpace(doc, y, 10, pageHeight, margin);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${run.label}  ·  ${run.cabinetCount} cabinets  ·  ${run.lengthMm} mm  ·  fillers ${run.fillerCount}  ·  tops ${run.countertopCount}`,
        margin,
        y,
      );
      y += 4.5;
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(run.cabinetNames.join(", ") || "—", margin + 2, y);
      y += 5.5;
    }
  }
  return y;
}
