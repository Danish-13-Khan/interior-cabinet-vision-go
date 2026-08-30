import { jsPDF } from "jspdf";
import { A4_PRINT_METRICS } from "../../printLayout";
import { ensurePageSpace, optimizeSceneImage, type PdfLayout } from "../../pdfExport/helpers";
import { buildProposalDocument, formatProposalMoney } from "./proposalDocument";
import type { ProposalViewFrame } from "./types";
import {
  drawApprovalBlock,
  drawProposalHeader,
  drawProposalIdentity,
  drawProposalSectionTitle,
  drawProposalTotals,
  drawWrappedNote,
} from "./proposalPdfDraw";
import type { ProposalDocument } from "./types";

function drawRows(
  layout: PdfLayout,
  y: number,
  rows: Array<{ left: string; right: string }>,
) {
  const { doc, margin, contentWidth, pageHeight } = layout;
  for (const row of rows) {
    y = ensurePageSpace(doc, y, 5, pageHeight, margin);
    doc.setFontSize(8.5);
    doc.setTextColor(45, 58, 48);
    doc.text(row.left.slice(0, 62), margin, y);
    doc.setTextColor(90, 104, 96);
    doc.text(row.right.slice(0, 36), margin + contentWidth, y, { align: "right" });
    y += 5;
  }
  return y + 3;
}

async function drawViewFrames(
  layout: PdfLayout,
  y: number,
  frames: ProposalViewFrame[],
) {
  const { doc, margin, contentWidth, pageHeight } = layout;
  for (const frame of frames) {
    const hero = await optimizeSceneImage(frame.dataUrl);
    if (!hero) continue;
    y = ensurePageSpace(doc, y, 82, pageHeight, margin);
    const format = /^data:image\/png/i.test(hero) ? "PNG" : "JPEG";
    doc.addImage(hero, format, margin, y, contentWidth, 70);
    y += 74;
    doc.setFontSize(8);
    doc.setTextColor(95, 110, 102);
    doc.text(`${frame.viewName} · Captured from selected client view`, margin, y);
    y += 8;
  }
  return y;
}

export async function exportProposalPdf(
  proposal: ProposalDocument,
  frames: ProposalViewFrame[] = [],
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const layout: PdfLayout = {
    doc,
    pageWidth: A4_PRINT_METRICS.pageWidthMm,
    pageHeight: A4_PRINT_METRICS.pageHeightMm,
    margin: A4_PRINT_METRICS.marginMm,
    contentWidth: A4_PRINT_METRICS.contentWidthMm,
    rowHeight: 7,
  };
  drawProposalHeader(layout, proposal);
  let y = drawProposalIdentity(layout, 38, proposal);
  y = await drawViewFrames(layout, y, frames);
  y = drawProposalSectionTitle(layout, y, "Named client views");
  y = drawRows(layout, y, proposal.views.map((view) => ({
    left: view.viewName,
    right: frames.some((frame) => frame.cameraId === view.cameraId)
      ? "Captured from selected client view"
      : "Named view",
  })));
  y = drawProposalSectionTitle(layout, y, "Cabinet summary");
  y = drawRows(layout, y, proposal.cabinets.map((line) => ({
    left: `${line.mark} · ${line.name}`,
    right: proposal.priceDetail === "itemized"
      ? formatProposalMoney(proposal, line.sellPrice)
      : "Included",
  })));
  y = drawProposalSectionTitle(layout, y, "Materials and finishes");
  y = drawRows(layout, y, proposal.materials.map((line) => ({
    left: line.name,
    right: line.role,
  })));
  y = drawProposalTotals(layout, y, proposal);
  y = drawWrappedNote(layout, y, "Inclusions", proposal.inclusions);
  y = drawWrappedNote(layout, y, "Exclusions", proposal.exclusions);
  y = drawApprovalBlock(layout, y);
  doc.setFontSize(7);
  doc.setTextColor(140, 150, 144);
  doc.text(
    `Quote ${proposal.quoteSnapshotId} · Rev ${proposal.revision} · Not a workshop packet`,
    layout.margin,
    layout.pageHeight - 8,
  );
  return doc.output("blob");
}

export async function exportInteriorProposalPdf(
  document: Parameters<typeof buildProposalDocument>[0],
  frames: ProposalViewFrame[] = [],
  options: { now?: string; staleOverride?: boolean } = {},
) {
  return exportProposalPdf(buildProposalDocument(document, options), frames);
}
