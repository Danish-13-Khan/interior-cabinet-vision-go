import type { ProjectReport } from "../projectReport";
import { ensurePageSpace, type PdfLayout } from "./helpers";

function fallbackWarningCount(report: ProjectReport) {
  return report.identityDiagnostics.filter((item) => (
    item.code === "family-resolved-from-type"
    || item.code === "silent-fallback-blocked"
    || item.code === "skipped-unidentified-cabinet"
  )).length;
}

export function drawCoverSchedule(
  layout: PdfLayout,
  y: number,
  report: ProjectReport,
): number {
  const { doc, pageHeight, margin, rowHeight } = layout;
  const warnings = fallbackWarningCount(report);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    warnings === 0 ? "Fallback warnings: none" : `Fallback warnings: ${warnings}`,
    margin,
    y,
  );
  y += 8;

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

  for (const cabinet of report.cabinetSchedule) {
    y = ensurePageSpace(doc, y, 5, pageHeight, margin);
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `${cabinet.mark}  ${cabinet.cabinetId}  ${cabinet.widthMm}x${cabinet.heightMm}x${cabinet.depthMm}  ${cabinet.constructionLabel}`,
      margin,
      y,
    );
    y += 4.2;
  }

  if (report.runSummaries.length === 0) return y;
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
    y += 4.5;
    if (run.countertopIds.length > 0) {
      doc.text(`CT ${run.countertopIds.join(" ")}`, margin + 2, y);
      y += 5.5;
    } else {
      y += 1;
    }
  }
  return y;
}
