import { jsPDF } from "jspdf";
import { A4_PRINT_METRICS } from "../../printLayout";
import { buildProposalDocument } from "./proposalDocument";
import { drawCoverPage } from "./proposalPdfCover";
import { drawFinishBoardPage } from "./proposalPdfFinishBoard";
import { registerProposalFont } from "./proposalPdfFont";
import { drawPricingPage } from "./proposalPdfPricing";
import { drawRoomPage } from "./proposalPdfRoom";
import type { ProposalPdfLayout } from "./proposalPdfTheme";
import type { ProposalDocument, ProposalViewFrame } from "./types";

/**
 * The client proposal (roadmap D3): cover, one page per printed view, the
 * finish board, then the price page with approval. Stills come from the
 * frames bound to the proposal's views; the first room's frame is the hero.
 */
export async function exportProposalPdf(
  proposal: ProposalDocument,
  frames: ProposalViewFrame[] = [],
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const layout: ProposalPdfLayout = {
    doc,
    pageWidth: A4_PRINT_METRICS.pageWidthMm,
    pageHeight: A4_PRINT_METRICS.pageHeightMm,
    margin: A4_PRINT_METRICS.marginMm,
    contentWidth: A4_PRINT_METRICS.contentWidthMm,
    rowHeight: 7,
    face: await registerProposalFont(doc),
  };
  const frameFor = (cameraId: string) => frames.find((frame) => frame.cameraId === cameraId) ?? null;
  const hero = proposal.rooms[0] ? frameFor(proposal.rooms[0].cameraId) : frames[0] ?? null;
  await drawCoverPage(layout, proposal, hero);
  for (const room of proposal.rooms) {
    await drawRoomPage(layout, proposal, room, frameFor(room.cameraId));
  }
  drawFinishBoardPage(layout, proposal);
  const paged = new Set(proposal.rooms.map((room) => room.cameraId));
  drawPricingPage(layout, proposal, proposal.views.filter((view) => !paged.has(view.cameraId)));
  return doc.output("blob");
}

export async function exportInteriorProposalPdf(
  document: Parameters<typeof buildProposalDocument>[0],
  frames: ProposalViewFrame[] = [],
  options: { now?: string; staleOverride?: boolean } = {},
) {
  return exportProposalPdf(buildProposalDocument(document, options), frames);
}
