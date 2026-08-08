import { JOB_STATUS_LABELS } from "../jobMeta";
import type { ProjectReport } from "../projectReport";
import { drawLabeledValue, ensurePageSpace, type PdfLayout } from "./helpers";

export function drawCostingSection(
  layout: PdfLayout,
  y: number,
  report: ProjectReport,
): number {
  const { doc, pageHeight, margin, rowHeight } = layout;
  let currentX = margin;

  y = ensurePageSpace(doc, y + 8, 36, pageHeight, margin);
  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Hardware Schedule", margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${report.hardwareSchedule.length} SKUs  ·  hardware total Rs ${report.projectCost.totalHardware.toLocaleString()}  ·  allowance Rs ${report.projectCost.hardwareAllowance.toLocaleString()}`,
    margin,
    y,
  );
  y += 6;

  const hwHeaders = ["Hardware", "Kind", "Qty", "Unit", "Total", "Marks"];
  const hwWidths = [52, 22, 14, 20, 22, 30];
  const hwTableWidth = hwWidths.reduce((sum, value) => sum + value, 0);
  doc.setFillColor(232, 237, 243);
  doc.rect(margin, y, hwTableWidth, rowHeight, "F");
  doc.setFontSize(8);
  doc.setTextColor(65, 76, 91);
  currentX = margin;
  hwHeaders.forEach((header, index) => {
    doc.text(header, currentX + 1.3, y + rowHeight - 2.1);
    currentX += hwWidths[index];
  });
  y += rowHeight;

  report.hardwareSchedule.slice(0, 18).forEach((row, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, hwTableWidth, rowHeight, "F");
    }
    const values = [
      row.label.length > 24 ? `${row.label.slice(0, 23)}…` : row.label,
      row.kind,
      String(row.quantity),
      String(row.unitCost),
      String(row.totalCost),
      row.cabinetMarks.slice(0, 4).join(" "),
    ];
    currentX = margin;
    values.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += hwWidths[cellIndex];
    });
    y += rowHeight;
  });
  if (report.hardwareSchedule.length > 18) {
    doc.setTextColor(100, 116, 139);
    doc.text(`… +${report.hardwareSchedule.length - 18} more hardware lines`, margin, y);
    y += 5;
  }

  y = ensurePageSpace(doc, y + 8, 48, pageHeight, margin);
  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Project Costing", margin, y);
  y += 8;

  drawLabeledValue(doc, margin, y, 42, "Material", `Rs ${report.projectCost.totalMaterial.toLocaleString()}`);
  drawLabeledValue(doc, margin + 46, y, 42, "Hardware", `Rs ${report.projectCost.totalHardware.toLocaleString()}`);
  drawLabeledValue(doc, margin + 92, y, 42, "Labour", `Rs ${report.projectCost.totalLabour.toLocaleString()}`);
  drawLabeledValue(doc, margin + 138, y, 44, "Workshop", `Rs ${report.projectCost.grandTotal.toLocaleString()}`);
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Waste Rs ${report.projectCost.totalWaste.toLocaleString()}  ·  Finish Rs ${report.projectCost.totalFinish.toLocaleString()}  ·  HW allow Rs ${report.projectCost.hardwareAllowance.toLocaleString()}  ·  Labour allow Rs ${report.projectCost.labourAllowance.toLocaleString()}  ·  Preset ${report.projectCost.settings.presetId}`,
    margin,
    y,
  );
  y += 10;

  y = ensurePageSpace(doc, y, 56, pageHeight, margin);
  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Quote / Estimate", margin, y);
  y += 8;

  const quote = report.quote;
  drawLabeledValue(doc, margin, y, 42, "Workshop", `Rs ${quote.workshopSubtotal.toLocaleString()}`);
  drawLabeledValue(doc, margin + 46, y, 42, "Markup", `Rs ${quote.markupAmount.toLocaleString()}`);
  drawLabeledValue(doc, margin + 92, y, 42, "Tax", `Rs ${quote.taxAmount.toLocaleString()}`);
  drawLabeledValue(doc, margin + 138, y, 44, "Quote total", `Rs ${quote.sellTotal.toLocaleString()}`);
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Rev ${report.summary.revision}  ·  Finish premium Rs ${quote.finishPremiumTotal.toLocaleString()}  ·  Discount Rs ${quote.discountAmount.toLocaleString()}  ·  Valid ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : "—"}`,
    margin,
    y,
  );
  y += 6;
  doc.text(
    `Includes: ${quote.settings.inclusions.slice(0, 110)}`,
    margin,
    y,
  );
  y += 4;
  doc.text(
    `Excludes: ${quote.settings.exclusions.slice(0, 110)}`,
    margin,
    y,
  );
  y += 8;

  const quoteHeaders = ["Mark", "Cabinet", "Workshop", "Sell"];
  const quoteWidths = [18, 70, 36, 36];
  const quoteTableWidth = quoteWidths.reduce((sum, value) => sum + value, 0);
  y = ensurePageSpace(doc, y, rowHeight * 2, pageHeight, margin);
  doc.setFillColor(232, 237, 243);
  doc.rect(margin, y, quoteTableWidth, rowHeight, "F");
  doc.setFontSize(8);
  doc.setTextColor(65, 76, 91);
  currentX = margin;
  quoteHeaders.forEach((header, index) => {
    doc.text(header, currentX + 1.3, y + rowHeight - 2.1);
    currentX += quoteWidths[index];
  });
  y += rowHeight;

  quote.cabinetLines.forEach((line, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, quoteTableWidth, rowHeight, "F");
    }
    const row = [
      line.mark,
      line.cabinetName.length > 28 ? `${line.cabinetName.slice(0, 27)}…` : line.cabinetName,
      String(line.workshopCost),
      String(line.sellPrice),
    ];
    currentX = margin;
    row.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += quoteWidths[cellIndex];
    });
    y += rowHeight;
  });

  if (report.quoteHistory.length > 0) {
    y = ensurePageSpace(doc, y + 6, 24, pageHeight, margin);
    doc.setFontSize(10);
    doc.setTextColor(34, 44, 59);
    doc.text("Revision Pricing History", margin, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    for (const snap of report.quoteHistory.slice(0, 6)) {
      y = ensurePageSpace(doc, y, 5, pageHeight, margin);
      doc.text(
        `Rev ${snap.revision}  ·  ${new Date(snap.quotedAt).toLocaleDateString()}  ·  workshop Rs ${snap.workshopTotal.toLocaleString()}  ·  sell Rs ${snap.sellTotal.toLocaleString()}`,
        margin,
        y,
      );
      y += 4.5;
    }
  }

  if (report.review.history.length > 0) {
    y = ensurePageSpace(doc, y + 6, 24, pageHeight, margin);
    doc.setFontSize(10);
    doc.setTextColor(34, 44, 59);
    doc.text("Design Revision / Approval Log", margin, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    for (const snap of report.review.history.slice(0, 8)) {
      y = ensurePageSpace(doc, y, 8, pageHeight, margin);
      doc.text(
        `Rev ${snap.revision}  ·  ${JOB_STATUS_LABELS[snap.status]}  ·  ${new Date(snap.createdAt).toLocaleDateString()}  ·  cabinets ${snap.fingerprint.cabinetCount}  ·  sell Rs ${snap.fingerprint.sellTotal.toLocaleString()}${snap.releasedForProduction ? "  ·  RELEASED" : ""}`,
        margin,
        y,
      );
      y += 4;
      if (snap.changeLog[0]) {
        doc.text(`  ${snap.changeLog[0].summary}`, margin, y);
        y += 4;
      }
    }
  }
  return y;
}
