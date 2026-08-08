import type { ProjectReport } from "../projectReport";
import { ensurePageSpace, type PdfLayout } from "./helpers";

export function drawCutlistSection(
  layout: PdfLayout,
  y: number,
  report: ProjectReport,
): number {
  const { doc, pageHeight, margin, rowHeight } = layout;
  let currentX = margin;

  y += 4;

  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Production Cutlist", margin, y);
  y += 6;

  const allItems = report.productionCutlist;

  const cutHeaders = ["Ref", "Cabinet", "Part", "Material", "Thk", "Qty", "L", "W"];
  const cutColWidths = [18, 28, 34, 26, 12, 12, 16, 16];
  const cutTableWidth = cutColWidths.reduce((total, value) => total + value, 0);

  doc.setFillColor(232, 237, 243);
  doc.rect(margin, y, cutTableWidth, rowHeight, "F");
  doc.setFontSize(8);
  doc.setTextColor(65, 76, 91);
  currentX = margin;
  cutHeaders.forEach((header, index) => {
    doc.text(header, currentX + 1.3, y + rowHeight - 2.1);
    currentX += cutColWidths[index];
  });
  y += rowHeight;

  allItems.forEach((item, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, cutTableWidth, rowHeight, "F");
    }

    const row = [
      item.shopRef,
      item.cabinetName.length > 12 ? `${item.cabinetName.slice(0, 11)}…` : item.cabinetName,
      item.label.length > 15 ? `${item.label.slice(0, 14)}…` : item.label,
      item.material.length > 11 ? `${item.material.slice(0, 10)}…` : item.material,
      String(item.thicknessMm),
      String(item.quantity),
      String(item.lengthMm),
      String(item.widthMm),
    ];

    currentX = margin;
    row.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += cutColWidths[cellIndex];
    });
    y += rowHeight;
  });

  // Grouped by material appendix
  y = ensurePageSpace(doc, y + 10, 20, pageHeight, margin);
  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Cutlist by Material", margin, y);
  y += 6;

  for (const group of report.groupedByMaterial) {
    y = ensurePageSpace(doc, y, 14, pageHeight, margin);
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `${group.title}  ·  ${group.totalQuantity} pcs  ·  ${group.totalAreaM2.toFixed(2)} m2`,
      margin,
      y,
    );
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    for (const line of group.lines.slice(0, 12)) {
      y = ensurePageSpace(doc, y, 5, pageHeight, margin);
      doc.text(
        `${line.shopRef}  ${line.cabinetName}: ${line.label}  ${line.quantity}x  ${line.lengthMm}x${line.widthMm}x${line.thicknessMm}`,
        margin + 2,
        y,
      );
      y += 4.2;
    }
    if (group.lines.length > 12) {
      doc.text(`… +${group.lines.length - 12} more lines`, margin + 2, y);
      y += 5;
    }
    y += 2;
  }
  return y;
}
