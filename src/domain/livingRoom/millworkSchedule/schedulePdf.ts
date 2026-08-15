import { jsPDF } from "jspdf";
import { A4_PRINT_METRICS } from "../../printLayout";
import { ensurePageSpace } from "../../pdfExport/helpers";
import { formatMaterialLabels } from "./formatMaterials";
import { formatWhdMm } from "./formatSize";
import type { MillworkSchedule } from "./types";

function drawHeader(doc: jsPDF, schedule: MillworkSchedule, margin: number, pageWidth: number) {
  doc.setFillColor(36, 52, 48);
  doc.rect(0, 0, pageWidth, 26, "F");
  doc.setFontSize(10);
  doc.setTextColor(214, 224, 218);
  doc.text("WORKSHOP", margin, 10);
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("Millwork Schedule v1", margin, 19);
  doc.setFontSize(9);
  doc.setTextColor(28, 38, 34);
  doc.text(schedule.projectName.slice(0, 52), margin, 34);
  doc.setTextColor(95, 110, 102);
  doc.text(
    `${schedule.roomName} · ${schedule.lines.length} piece${schedule.lines.length === 1 ? "" : "s"} · ${new Date(schedule.exportedAt).toLocaleString()}`,
    margin,
    40,
  );
}

/** Shop PDF takeoff. Not a client brochure, cutlist, or CNC program. */
export function exportMillworkSchedulePdf(schedule: MillworkSchedule): Blob {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = A4_PRINT_METRICS.marginMm;
  drawHeader(doc, schedule, margin, pageWidth);
  let y = 48;
  doc.setFontSize(7.5);
  doc.setTextColor(90, 104, 112);
  doc.text("Name / id", margin, y);
  doc.text("Category", margin + 72, y);
  doc.text("W × H × D mm", margin + 108, y);
  doc.text("Materials", margin + 152, y);
  doc.text("Qty", margin + 252, y);
  y += 4;
  doc.setDrawColor(200, 208, 204);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  if (schedule.lines.length === 0) {
    doc.setTextColor(95, 110, 102);
    doc.setFontSize(9);
    doc.text("No millwork objects in the active living room.", margin, y);
    y += 8;
  }

  for (const line of schedule.lines) {
    y = ensurePageSpace(doc, y, 14, pageHeight, margin);
    doc.setFontSize(9);
    doc.setTextColor(28, 38, 34);
    doc.text(line.name.slice(0, 36), margin, y);
    doc.setFontSize(7);
    doc.setTextColor(95, 110, 102);
    doc.text(line.objectId.slice(0, 42), margin, y + 4);
    doc.setFontSize(8);
    doc.setTextColor(45, 58, 68);
    doc.text(line.category, margin + 72, y);
    doc.text(formatWhdMm(line.widthMm, line.heightMm, line.depthMm), margin + 108, y);
    doc.text(formatMaterialLabels(line.materialLabels).slice(0, 48), margin + 152, y);
    doc.text(String(line.quantity), margin + 252, y);
    y += 11;
  }

  y = ensurePageSpace(doc, y, 12, pageHeight, margin);
  doc.setFontSize(8);
  doc.setTextColor(95, 110, 102);
  doc.text(schedule.honestyNote, margin, y + 4);
  return doc.output("blob");
}
