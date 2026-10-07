import type { jsPDF } from "jspdf";
import { ensurePageSpace } from "../../pdfExport/helpers";
import { formatProposalMoney } from "./proposalDocument";
import { INK, fill, setType, stroke, writeParagraph, writeText, type ProposalPdfLayout } from "./proposalPdfTheme";
import type { ProposalDocument } from "./types";

/**
 * jsPDF's built-in fonts are WinAnsi: a rupee sign prints as a superscript "1".
 * Spell out the symbols a quote can carry; anything else outside Latin-1 is dropped.
 * Used only when the embedded font could not be loaded.
 */
export function pdfSafeText(text: string): string {
  return text
    .replace(/₹\s?/g, "Rs ")
    .replace(/€\s?/g, "EUR ")
    .replace(/£/g, "GBP ")
    .replace(/[—–]/g, "-")
    .replace(/[^\u0000-ÿ]/g, "");
}

export function pdfMoney(layout: ProposalPdfLayout, proposal: ProposalDocument, amount: number) {
  return layout.face.text(formatProposalMoney(proposal, amount));
}

export function drawCard(layout: ProposalPdfLayout, x: number, y: number, width: number, label: string, value: string) {
  const { doc } = layout;
  fill(doc, INK.card);
  doc.roundedRect(x, y, width, 15, 2, 2, "F");
  setType(layout, 7.5, INK.faint);
  writeText(layout, label, x + 3, y + 5);
  setType(layout, 9, INK.body, "bold");
  writeText(layout, value, x + 3, y + 11.5, { maxChars: 28 });
}

export function drawProposalSectionTitle(
  layout: ProposalPdfLayout,
  y: number,
  title: string,
  keepWithMm = 0,
) {
  const { doc, margin, pageHeight } = layout;
  y = ensurePageSpace(doc, y, 10 + keepWithMm, pageHeight, margin);
  setType(layout, 11, INK.title, "bold");
  writeText(layout, title, margin, y);
  return y + 6;
}

/** Two-column rows: label left, value right. */
export function drawRows(
  layout: ProposalPdfLayout,
  y: number,
  rows: Array<{ left: string; right: string }>,
) {
  const { doc, margin, contentWidth, pageHeight } = layout;
  for (const row of rows) {
    y = ensurePageSpace(doc, y, 5, pageHeight, margin);
    setType(layout, 8.5, INK.body);
    writeText(layout, row.left, margin, y, { maxChars: 62 });
    setType(layout, 8.5, INK.muted);
    writeText(layout, row.right, margin + contentWidth, y, { align: "right", maxChars: 36 });
    y += 5;
  }
  return y + 3;
}

export function drawWrappedNote(layout: ProposalPdfLayout, y: number, label: string, text: string) {
  const { margin, contentWidth } = layout;
  y = drawProposalSectionTitle(layout, y, label, 12);
  setType(layout, 8.5, INK.body);
  return writeParagraph(layout, text || "-", margin, y, contentWidth) + 3;
}

export function drawProposalTotals(layout: ProposalPdfLayout, y: number, proposal: ProposalDocument) {
  const { doc, margin, contentWidth, pageHeight } = layout;
  y = drawProposalSectionTitle(layout, y, "Price summary");
  // The summary lines end with the total; it is drawn once, large, below.
  const lines = proposal.summaryLines.filter((line) => !/^total$/i.test(line.label.trim()));
  for (const line of lines) {
    y = ensurePageSpace(doc, y, 6, pageHeight, margin);
    setType(layout, 8.5, INK.body);
    writeText(layout, line.label, margin, y);
    writeText(layout, pdfMoney(layout, proposal, line.amount), margin + contentWidth, y, { align: "right" });
    y += 5;
  }
  y += 2;
  stroke(doc, INK.rule);
  doc.line(margin, y - 1, margin + contentWidth, y - 1);
  y += 5;
  setType(layout, 13, INK.title, "bold");
  writeText(layout, "Total", margin, y);
  writeText(layout, pdfMoney(layout, proposal, proposal.sellTotal), margin + contentWidth, y, { align: "right" });
  return y + 8;
}

export function drawApprovalBlock(layout: ProposalPdfLayout, y: number) {
  const { doc, margin, contentWidth } = layout;
  y = drawProposalSectionTitle(layout, y + 2, "Approval", 28);
  const half = (contentWidth - 8) / 2;
  for (const [index, label] of ["Customer signature", "Sales signature"].entries()) {
    const x = margin + index * (half + 8);
    stroke(doc, INK.rule);
    doc.line(x, y + 14, x + half, y + 14);
    setType(layout, 8, INK.muted);
    writeText(layout, label, x, y + 19);
    writeText(layout, "Date", x, y + 25);
  }
  return y + 30;
}

export type { jsPDF };
