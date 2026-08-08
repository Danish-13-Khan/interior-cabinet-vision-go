import type { ProjectReport } from "../projectReport";
import { ensurePageSpace, type PdfLayout } from "./helpers";

export function drawMaterialsSection(
  layout: PdfLayout,
  y: number,
  report: ProjectReport,
): number {
  const { doc, pageWidth, pageHeight, margin, rowHeight } = layout;
  let currentX = margin;

  doc.addPage();
  doc.setFillColor(247, 248, 250);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  y = margin;

  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Material Summary", margin, y);
  y += 6;

  const materialHeaders = ["Material", "Thk", "Area m2", "Boards"];
  const materialWidths = [78, 20, 34, 28];
  const materialTableWidth = materialWidths.reduce((total, value) => total + value, 0);

  doc.setFillColor(232, 237, 243);
  doc.rect(margin, y, materialTableWidth, rowHeight, "F");
  doc.setFontSize(8);
  doc.setTextColor(65, 76, 91);
  currentX = margin;
  materialHeaders.forEach((header, index) => {
    doc.text(header, currentX + 1.3, y + rowHeight - 2.1);
    currentX += materialWidths[index];
  });
  y += rowHeight;

  report.materialSummary.forEach((item, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, materialTableWidth, rowHeight, "F");
    }

    const row = [
      item.material,
      String(item.thicknessMm),
      item.totalAreaM2.toFixed(2),
      String(item.estimatedBoards),
    ];

    currentX = margin;
    row.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += materialWidths[cellIndex];
    });
    y += rowHeight;
  });

  y = ensurePageSpace(doc, y + 8, 40, pageHeight, margin);
  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Sheet Yield Planning", margin, y);
  y += 6;
  const yieldPlan = report.sheetYield;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${yieldPlan.sheet.label}  ·  usable ${yieldPlan.usableLengthMm}x${yieldPlan.usableWidthMm}  ·  kerf ${yieldPlan.settings.kerfMm} mm  ·  sheets ${yieldPlan.totalSheets}  ·  yield ${yieldPlan.overallYieldPercent}%  ·  waste ${yieldPlan.totalWasteAreaM2.toFixed(2)} m2  ·  reclaimable offcuts ${yieldPlan.reclaimableOffcutAreaM2.toFixed(2)} m2`,
    margin,
    y,
  );
  y += 6;

  const yieldHeaders = ["Material", "Thk", "Parts", "Sheets", "Yield", "Waste"];
  const yieldWidths = [54, 16, 20, 22, 22, 26];
  const yieldTableWidth = yieldWidths.reduce((sum, value) => sum + value, 0);
  doc.setFillColor(232, 237, 243);
  doc.rect(margin, y, yieldTableWidth, rowHeight, "F");
  doc.setFontSize(8);
  doc.setTextColor(65, 76, 91);
  currentX = margin;
  yieldHeaders.forEach((header, index) => {
    doc.text(header, currentX + 1.3, y + rowHeight - 2.1);
    currentX += yieldWidths[index];
  });
  y += rowHeight;

  yieldPlan.groups.forEach((group, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, yieldTableWidth, rowHeight, "F");
    }
    const row = [
      group.material,
      String(group.thicknessMm),
      String(group.partCount),
      String(group.sheetsUsed),
      `${group.yieldPercent}%`,
      group.wasteAreaM2.toFixed(2),
    ];
    currentX = margin;
    row.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += yieldWidths[cellIndex];
    });
    y += rowHeight;
  });

  // Compact per-sheet cut grouping (first few sheets)
  let sheetSamples = 0;
  for (const group of yieldPlan.groups) {
    for (const sheet of group.sheets) {
      if (sheetSamples >= 4) break;
      sheetSamples += 1;
      y = ensurePageSpace(doc, y + 4, 16, pageHeight, margin);
      doc.setFontSize(9);
      doc.setTextColor(34, 44, 59);
      doc.text(
        `${group.material} ${group.thicknessMm}mm · ${sheet.label} · ${sheet.parts.length} cuts · yield ${sheet.yieldPercent}%`,
        margin,
        y,
      );
      y += 4;
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const refs = sheet.parts
        .slice(0, 8)
        .map((part) => part.shopRef)
        .join(", ");
      doc.text(
        refs + (sheet.parts.length > 8 ? ` +${sheet.parts.length - 8} more` : ""),
        margin + 2,
        y,
      );
      y += 4;
      if (sheet.offcuts[0]) {
        doc.text(
          `Offcut e.g. ${sheet.offcuts[0].lengthMm}x${sheet.offcuts[0].widthMm}${sheet.offcuts[0].reclaimable ? " reclaimable" : ""}`,
          margin + 2,
          y,
        );
        y += 4;
      }
    }
    if (sheetSamples >= 4) break;
  }
  return y;
}
