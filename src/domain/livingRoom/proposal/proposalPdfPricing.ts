import {
  drawApprovalBlock,
  drawProposalSectionTitle,
  drawProposalTotals,
  drawRows,
  drawWrappedNote,
} from "./proposalPdfDraw";
import { drawPageFooter, newPage, type ProposalPdfLayout } from "./proposalPdfTheme";
import type { ProposalDocument, ProposalNamedView } from "./types";

/**
 * Price page (roadmap D3): summary lines, tax and the one total, inclusions,
 * exclusions and the approval block. Project-wide lines appear here only.
 */
export function drawPricingPage(
  layout: ProposalPdfLayout,
  proposal: ProposalDocument,
  viewsWithoutPage: ProposalNamedView[],
): void {
  let y = newPage(layout);
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
