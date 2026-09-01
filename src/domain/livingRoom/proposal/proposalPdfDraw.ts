import type { jsPDF } from "jspdf";
import type { PdfLayout } from "../../pdfExport/helpers";
import { ensurePageSpace } from "../../pdfExport/helpers";
import { formatProposalMoney } from "./proposalDocument";
import type { ProposalDocument } from "./types";

export function drawProposalHeader(layout: PdfLayout, proposal: ProposalDocument) {
  const { doc, margin, pageWidth } = layout;
  doc.setFillColor(36, 52, 48);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setFontSize(10);
  doc.setTextColor(214, 224, 218);
  doc.text(proposal.brand.toUpperCase(), margin, 11);
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(proposal.draft ? "Draft Proposal" : "Proposal", margin, 21);
  if (proposal.draft || proposal.staleDisclosed) {
    doc.setFontSize(9);
    doc.setTextColor(250, 204, 166);
    doc.text(
      proposal.draft ? "DRAFT — not a frozen quote" : "STALE — live design differs",
      pageWidth - margin,
      18,
      { align: "right" },
    );
  }
}

export function drawProposalIdentity(
  layout: PdfLayout,
  y: number,
  proposal: ProposalDocument,
) {
  const { doc, margin, contentWidth } = layout;
  doc.setFontSize(16);
  doc.setTextColor(28, 38, 34);
  doc.text(proposal.customerName.slice(0, 42), margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(95, 110, 102);
  doc.text(
    `${proposal.projectNumber} · ${proposal.roomName} · Rev ${proposal.revision}`,
    margin,
    y,
  );
  y += 10;
  const card = (contentWidth - 8) / 3;
  const valid = proposal.validUntil
    ? new Date(proposal.validUntil).toLocaleDateString()
    : "No expiry disclosed";
  drawCard(doc, margin, y, card, "Quote", proposal.quoteSnapshotId.slice(0, 22));
  drawCard(doc, margin + card + 4, y, card, "Date", new Date(proposal.proposalDate).toLocaleDateString());
  drawCard(doc, margin + (card + 4) * 2, y, card, "Valid until", valid);
  return y + 20;
}

function drawCard(doc: jsPDF, x: number, y: number, width: number, label: string, value: string) {
  doc.setFillColor(247, 249, 244);
  doc.roundedRect(x, y, width, 15, 2, 2, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(111, 121, 112);
  doc.text(label, x + 3, y + 5);
  doc.setFontSize(9);
  doc.setTextColor(37, 48, 40);
  doc.text(value.slice(0, 28), x + 3, y + 11.5);
}

export function drawProposalSectionTitle(
  layout: PdfLayout,
  y: number,
  title: string,
  keepWithMm = 0,
) {
  const { doc, margin, pageHeight } = layout;
  y = ensurePageSpace(doc, y, 10 + keepWithMm, pageHeight, margin);
  doc.setFontSize(11);
  doc.setTextColor(28, 38, 34);
  doc.text(title, margin, y);
  return y + 6;
}

export function drawWrappedNote(layout: PdfLayout, y: number, label: string, text: string) {
  const { doc, margin, contentWidth, pageHeight } = layout;
  y = drawProposalSectionTitle(layout, y, label);
  doc.setFontSize(8.5);
  doc.setTextColor(55, 68, 60);
  const lines = doc.splitTextToSize(text || "—", contentWidth);
  for (const line of lines) {
    y = ensurePageSpace(doc, y, 5, pageHeight, margin);
    doc.text(line, margin, y);
    y += 4.5;
  }
  return y + 3;
}

export function drawProposalTotals(layout: PdfLayout, y: number, proposal: ProposalDocument) {
  const { doc, margin, contentWidth, pageHeight } = layout;
  y = drawProposalSectionTitle(layout, y, "Price summary");
  for (const line of proposal.summaryLines) {
    y = ensurePageSpace(doc, y, 6, pageHeight, margin);
    doc.setFontSize(8.5);
    doc.setTextColor(45, 58, 48);
    doc.text(line.label, margin, y);
    doc.text(formatProposalMoney(proposal, line.amount), margin + contentWidth, y, { align: "right" });
    y += 5;
  }
  y += 2;
  doc.setFontSize(12);
  doc.setTextColor(28, 38, 34);
  doc.text("Total", margin, y);
  doc.text(formatProposalMoney(proposal, proposal.sellTotal), margin + contentWidth, y, { align: "right" });
  return y + 8;
}

export function drawApprovalBlock(layout: PdfLayout, y: number) {
  const { doc, margin, contentWidth } = layout;
  y = drawProposalSectionTitle(layout, y + 2, "Approval", 28);
  const half = (contentWidth - 8) / 2;
  for (const [index, label] of ["Customer signature", "Sales signature"].entries()) {
    const x = margin + index * (half + 8);
    doc.setDrawColor(180, 190, 182);
    doc.line(x, y + 14, x + half, y + 14);
    doc.setFontSize(8);
    doc.setTextColor(95, 110, 102);
    doc.text(label, x, y + 19);
    doc.text("Date", x, y + 25);
  }
  return y + 30;
}
