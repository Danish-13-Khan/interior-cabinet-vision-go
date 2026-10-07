import {
  drawApprovalBlock,
  drawProposalSectionTitle,
  drawProposalTotals,
  drawRows,
  drawWrappedNote,
  pdfMoney,
} from "./proposalPdfDraw";
import { roomLineRows } from "./proposalPdfRoom";
import { INK, drawPageFooter, newPage, setType, writeText, type ProposalPdfLayout } from "./proposalPdfTheme";
import type { ProposalDocument, ProposalNamedView } from "./types";

/** Priced lines in rooms without a page, so the room subtotals and this block add up to the total. */
function drawOtherRooms(layout: ProposalPdfLayout, y: number, proposal: ProposalDocument): number {
  if (!proposal.otherRooms.length) return y;
  y = drawProposalSectionTitle(layout, y, "Other rooms", 12);
  for (const room of proposal.otherRooms) {
    setType(layout, 9, INK.title, "bold");
    writeText(layout, room.roomName, layout.margin, y, { maxChars: 40 });
    if (room.subtotal != null) {
      writeText(layout, pdfMoney(layout, proposal, room.subtotal), layout.margin + layout.contentWidth, y, { align: "right" });
    }
    y = drawRows(layout, y + 5, roomLineRows(layout, proposal, room.cabinets));
  }
  return y;
}

/**
 * Price page (roadmap D3): lines from rooms without a page, summary lines, tax
 * and the one total, inclusions, exclusions and the approval block.
 * Project-wide lines appear here only.
 */
export function drawPricingPage(
  layout: ProposalPdfLayout,
  proposal: ProposalDocument,
  viewsWithoutPage: ProposalNamedView[],
): void {
  let y = newPage(layout);
  y = drawOtherRooms(layout, y, proposal);
  y = drawProposalTotals(layout, y, proposal);
  if (viewsWithoutPage.length) {
    // A frozen view whose camera no longer exists still gets named, so the customer sees the full list.
    y = drawProposalSectionTitle(layout, y, "Named client views");
    y = drawRows(layout, y, viewsWithoutPage.map((view) => ({ left: view.viewName, right: "Named view" })));
  }
  y = drawWrappedNote(layout, y, "Inclusions", proposal.inclusions);
  y = drawWrappedNote(layout, y, "Exclusions", proposal.exclusions);
  drawApprovalBlock(layout, y);
  drawPageFooter(
    layout,
    `Quote ${proposal.quoteSnapshotId} · Rev ${proposal.revision} · Not a workshop packet`,
    `Page ${layout.doc.getNumberOfPages()}`,
  );
}
