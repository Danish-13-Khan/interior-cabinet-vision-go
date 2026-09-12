import { jsPDF } from "jspdf";
import type { InvoiceTemplateDocument } from "./invoiceDocument";

/** Invoice template PDF from a frozen quote — branding fields only, no payment rails. */
export async function exportInvoiceTemplatePdf(
  document: InvoiceTemplateDocument,
): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  let y = margin;
  doc.setFontSize(16);
  doc.text(document.title, margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.text(document.sellerName, margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(80);
  if (document.sellerGstin) {
    doc.text(`GSTIN: ${document.sellerGstin}`, margin, y);
    y += 4;
  }
  if (document.sellerAddress) {
    const lines = doc.splitTextToSize(document.sellerAddress, 90);
    doc.text(lines, margin, y);
    y += lines.length * 4;
  }
  if (document.sellerPhone || document.sellerEmail) {
    doc.text(
      [document.sellerPhone, document.sellerEmail].filter(Boolean).join(" · "),
      margin,
      y,
    );
    y += 5;
  }
  doc.setTextColor(20);
  doc.setFontSize(10);
  doc.text(`Invoice no: ${document.invoiceNumber}`, 120, margin);
  doc.text(`Date: ${document.invoiceDate || "—"}`, 120, margin + 5);
  doc.text(`Project: ${document.projectNumber} · Rev ${document.revision}`, 120, margin + 10);
  doc.text(`Bill to: ${document.customerName}`, 120, margin + 15);

  y = Math.max(y, margin + 28);
  doc.setFillColor(232, 237, 243);
  doc.rect(margin, y, 178, 7, "F");
  doc.setFontSize(9);
  doc.text("Description", margin + 2, y + 5);
  doc.text("Amount", 170, y + 5, { align: "right" });
  y += 9;
  for (const line of document.lines) {
    doc.text(line.label, margin + 2, y);
    doc.text(line.amountLabel, 170, y, { align: "right" });
    y += 5;
    if (y > 270) {
      doc.addPage();
      y = margin;
    }
  }
  y += 3;
  doc.setFontSize(12);
  doc.text("Total", margin + 2, y);
  doc.text(document.sellTotalLabel, 170, y, { align: "right" });
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(90);
  if (document.bankNote) {
    doc.text(doc.splitTextToSize(`Payment note: ${document.bankNote}`, 178), margin, y);
    y += 10;
  }
  doc.text(doc.splitTextToSize(document.disclaimer, 178), margin, y);
  y += 8;
  doc.text(`Frozen snapshot: ${document.snapshotId}`, margin, y);
  return doc.output("blob");
}
