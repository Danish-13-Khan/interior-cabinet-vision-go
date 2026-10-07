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
  pdfSafeText,
} from "./proposalPdfDraw";
import type { ProposalDocument } from "./types";

/** Longest edge of a view still on the page; keeps the page flow of the golden layout. */
const VIEW_FRAME_MAX_HEIGHT_MM = 70;

function pdfMoney(proposal: ProposalDocument, amount: number) {
  return pdfSafeText(formatProposalMoney(proposal, amount));
}

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
    doc.text(pdfSafeText(row.left).slice(0, 62), margin, y);
    doc.setTextColor(90, 104, 96);
    doc.text(pdfSafeText(row.right).slice(0, 36), margin + contentWidth, y, { align: "right" });
    y += 5;
  }
  return y + 3;
}

function imageAspect(doc: jsPDF, dataUrl: string): number {
  try {
    const { width, height } = doc.getImageProperties(dataUrl);
    if (width > 0 && height > 0) return width / height;
  } catch {
    /* unreadable header: fall back to the classic band */
  }
  return 16 / 9;
}

/** Room finishes come as one priced line per surface; the client reads one line per room. */
function clientCabinetRows(proposal: ProposalDocument): Array<{ left: string; right: string }> {
  const itemized = proposal.priceDetail === "itemized";
  const price = (amount: number) => (itemized ? pdfMoney(proposal, amount) : "Included");
  const rows: Array<{ left: string; right: string }> = [];
  const finishes = new Map<string, { count: number; amount: number }>();
  for (const line of proposal.cabinets) {
    if (!/^I\d+$/.test(line.mark)) {
      rows.push({ left: `${line.mark} · ${line.name}`, right: price(line.sellPrice) });
      continue;
    }
    const room = line.name.split(" · ")[0]?.trim() || "Room";
    const entry = finishes.get(room) ?? { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += line.sellPrice;
    finishes.set(room, entry);
  }
  for (const [room, entry] of finishes) {
    rows.push({
      left: `${room} · ${entry.count} room finish${entry.count === 1 ? "" : "es"} (floor, ceiling, walls)`,
      right: price(entry.amount),
    });
  }
  return rows;
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
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
    const format = /^data:image\/png/i.test(hero) ? "PNG" : "JPEG";
    // Keep the still's own aspect: a 16:9 photo squeezed into a fixed band reads as a mistake.
    const aspect = imageAspect(doc, hero);
    const width = Math.min(contentWidth, VIEW_FRAME_MAX_HEIGHT_MM * aspect);
    const height = width / aspect;
    y = ensurePageSpace(doc, y, height + 12, pageHeight, margin);
    doc.addImage(hero, format, margin + (contentWidth - width) / 2, y, width, height);
    y += height + 4;
    doc.setFontSize(8);
    doc.setTextColor(95, 110, 102);
    doc.text(pdfSafeText(frame.viewName), margin, y);
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
  // The captions already name every captured view; list the views only when one is missing.
  const uncaptured = proposal.views.filter((view) => !frames.some((frame) => frame.cameraId === view.cameraId));
  if (uncaptured.length) {
    y = drawProposalSectionTitle(layout, y, "Named client views");
    y = drawRows(layout, y, proposal.views.map((view) => ({
      left: view.viewName,
      right: uncaptured.includes(view) ? "Named view" : "Shown above",
    })));
  }
  y = drawProposalSectionTitle(layout, y, "Cabinet summary");
  y = drawRows(layout, y, clientCabinetRows(proposal));
  y = drawProposalSectionTitle(layout, y, "Materials and finishes");
  y = drawRows(layout, y, proposal.materials.map((line) => ({
    left: line.name,
    right: titleCase(line.role),
  })));
  y = drawProposalTotals(layout, y, proposal);
  y = drawWrappedNote(layout, y, "Inclusions", proposal.inclusions);
  y = drawWrappedNote(layout, y, "Exclusions", proposal.exclusions);
  y = drawApprovalBlock(layout, y);
  doc.setFontSize(7);
  doc.setTextColor(140, 150, 144);
  doc.text(
    pdfSafeText(`Quote ${proposal.quoteSnapshotId} · Rev ${proposal.revision} · Not a workshop packet`),
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
