import type { PdfLayout } from "../pdfExport/helpers";
import {
  DEFAULT_PRINT_NOTE_PLACEHOLDER,
} from "./notes";
import type { PrintLayoutMetrics, TitleBlockData } from "./types";

export const A4_PRINT_METRICS: PrintLayoutMetrics = {
  pageWidthMm: 210,
  pageHeightMm: 297,
  marginMm: 12,
  contentWidthMm: 186,
  titleBlockHeightMm: 18,
  notesAreaHeightMm: 32,
  drawingMaxHeightMm: 168,
};

/** Draw title block matching SVG print standards (mm coordinates). */
export function drawPdfTitleBlock(
  layout: PdfLayout,
  y: number,
  data: TitleBlockData,
): number {
  const { doc, margin, contentWidth } = layout;
  const h = A4_PRINT_METRICS.titleBlockHeightMm;
  const mid = margin + contentWidth * 0.52;
  const right = margin + contentWidth * 0.72;
  const info = margin + contentWidth * 0.86;

  doc.setDrawColor(42, 53, 64);
  doc.setLineWidth(0.35);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, h, "FD");
  doc.line(mid, y, mid, y + h);
  doc.line(right, y, right, y + h);
  doc.line(info, y, info, y + h);
  doc.line(margin, y + h * 0.38, mid, y + h * 0.38);
  doc.line(mid, y + h * 0.5, info, y + h * 0.5);
  doc.line(info, y + h / 3, margin + contentWidth, y + h / 3);
  doc.line(info, y + (h * 2) / 3, margin + contentWidth, y + (h * 2) / 3);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(data.projectName.slice(0, 42), margin + 2, y + 5);
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(data.sheetTitle.slice(0, 48), margin + 2, y + 10);
  doc.setFontSize(6);
  doc.text(
    `${data.projectNumber} · ${data.customerName}`.slice(0, 54),
    margin + 2,
    y + 15,
  );

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(data.viewLabel, mid + 2, y + 5.5);
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`SCALE ${data.scaleText}`, mid + 2, y + 11);
  doc.setFontSize(6);
  doc.text(data.statusLabel, mid + 2, y + 15.5);

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(data.sheetCode, right + 2, y + 5.5);
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text("SHEET", right + 2, y + 10.5);
  doc.setFontSize(7);
  doc.text(data.dateText, right + 2, y + 15.5);

  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(`REV ${data.revision}`, info + 1.5, y + 4.5);
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(`DRN ${data.drawnBy.slice(0, 10)}`, info + 1.5, y + 10);
  doc.text(`CHK ${data.checkedBy.slice(0, 10)}`, info + 1.5, y + 15.5);

  return y + h + 4;
}

export function drawPdfInfoAndNotes(
  layout: PdfLayout,
  y: number,
  data: TitleBlockData,
  noteLines: string[],
): number {
  const { doc, margin, contentWidth } = layout;
  const infoH = 8;
  const notesH = A4_PRINT_METRICS.notesAreaHeightMm;
  const col = contentWidth / 4;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, infoH);
  doc.line(margin + col, y, margin + col, y + infoH);
  doc.line(margin + col * 2, y, margin + col * 2, y + infoH);
  doc.line(margin + col * 3, y, margin + col * 3, y + infoH);
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(`REV ${data.revision}`, margin + 2, y + 5.2);
  doc.text(`DATE ${data.dateText}`, margin + col + 2, y + 5.2);
  doc.text(`NO. ${data.projectNumber.slice(0, 16)}`, margin + col * 2 + 2, y + 5.2);
  doc.text(
    `${data.statusLabel} · ${data.sheetCode}`.slice(0, 22),
    margin + col * 3 + 2,
    y + 5.2,
  );
  y += infoH + 3;

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("NOTES", margin, y);
  y += 2;
  doc.setDrawColor(148, 163, 184);
  doc.rect(margin, y, contentWidth, notesH);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const lines =
    noteLines.length > 0 ? noteLines.slice(0, 4) : [DEFAULT_PRINT_NOTE_PLACEHOLDER];
  lines.forEach((line, index) => {
    doc.text(`• ${line.slice(0, 95)}`, margin + 2, y + 6 + index * 6.5);
  });
  return y + notesH;
}

export function fitDrawingToContent(
  drawingWidthPx: number,
  drawingHeightPx: number,
  contentWidthMm: number,
  maxHeightMm: number,
) {
  const scale = Math.min(
    contentWidthMm / drawingWidthPx,
    maxHeightMm / drawingHeightPx,
  );
  return {
    drawWidth: drawingWidthPx * scale,
    drawHeight: drawingHeightPx * scale,
    scale,
  };
}
