import { jsPDF } from "jspdf";
import type { ProductionCutlistLine } from "../productionCutlist";

const COLUMNS: { title: string; width: number; value: (line: ProductionCutlistLine) => string }[] = [
  { title: "Shop ref", width: 22, value: (line) => line.shopRef },
  { title: "Cabinet", width: 32, value: (line) => line.cabinetName },
  { title: "Part", width: 36, value: (line) => line.label },
  { title: "Material", width: 28, value: (line) => line.material },
  { title: "Finish", width: 24, value: (line) => line.finish },
  { title: "Thk", width: 12, value: (line) => String(line.thicknessMm) },
  { title: "Qty", width: 12, value: (line) => String(line.quantity) },
  { title: "Size", width: 24, value: (line) => `${line.lengthMm} x ${line.widthMm}` },
  { title: "Edge", width: 28, value: (line) => line.edgeBanding },
  { title: "Grain", width: 22, value: (line) => line.grain },
  { title: "Notes", width: 33, value: (line) => line.notes?.trim() || "—" },
];

function wrapped(doc: jsPDF, text: string, width: number): string[] {
  const lines = doc.splitTextToSize(text || "—", Math.max(4, width - 2));
  return (Array.isArray(lines) ? lines : [String(lines)]).map(String);
}

function drawHeader(doc: jsPDF, margin: number, y: number) {
  let x = margin;
  doc.setFontSize(7);
  doc.setTextColor(65, 76, 91);
  for (const column of COLUMNS) {
    doc.text(column.title, x, y);
    x += column.width;
  }
}

export function cutlistPdfBlob(lines: readonly ProductionCutlistLine[], title = "Cut list"): Blob {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  doc.setFontSize(14);
  doc.setTextColor(34, 44, 59);
  doc.text(title, margin, 14);
  let y = 22;
  drawHeader(doc, margin, y);
  y += 4;

  for (const line of lines) {
    const cells = COLUMNS.map((column) => wrapped(doc, column.value(line), column.width));
    const rowLines = Math.max(1, ...cells.map((cell) => cell.length));
    const rowHeight = rowLines * 3.4 + 1.4;
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeader(doc, margin, y);
      y += 4;
    }
    cells.forEach((cell, index) => {
      const x = margin + COLUMNS.slice(0, index).reduce((sum, column) => sum + column.width, 0);
      cell.forEach((text, lineIndex) => doc.text(text, x, y + lineIndex * 3.4));
    });
    y += rowHeight;
  }
  return doc.output("blob");
}
