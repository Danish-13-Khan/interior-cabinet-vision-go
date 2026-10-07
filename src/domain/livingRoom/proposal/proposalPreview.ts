/**
 * Proposal preview in the app (roadmap Phase 3): the pages of the PDF that
 * "Create Proposal" would save, rendered to images so a bad frame is caught
 * in Present, not in the customer's inbox. Browser only: it rides on the
 * PDF.js worker the plan importer configures (`planUnderlayPdf.ts`); the
 * Node rasteriser for tests stays in `proposalPdfRaster.ts`.
 */

import { loadPdfDocument } from "../planUnderlayPdf";
import type { ProposalDocument } from "./types";

export type ProposalPreviewPage = {
  index: number;
  label: string;
  dataUrl: string;
  width: number;
  height: number;
};

/** What each page is, in the order `exportProposalPdf` writes them. */
export function proposalPreviewPageLabels(proposal: ProposalDocument): string[] {
  return ["Cover", ...proposal.rooms.map((room) => room.roomName), "Finishes", "Price and approval"];
}

/** Render every page of the proposal PDF to a JPEG data URL no wider than `maxWidthPx`. */
export async function renderProposalPreview(
  blob: Blob,
  proposal: ProposalDocument,
  options: { maxWidthPx?: number } = {},
): Promise<ProposalPreviewPage[]> {
  const maxWidth = options.maxWidthPx ?? 720;
  const labels = proposalPreviewPageLabels(proposal);
  const pdf = await loadPdfDocument(await blob.arrayBuffer());
  const pages: ProposalPreviewPage[] = [];
  try {
    for (let index = 1; index <= pdf.numPages; index += 1) {
      const page = await pdf.getPage(index);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: maxWidth / base.width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Preview canvas is unavailable.");
      await page.render({ canvasContext: context, viewport, background: "rgb(255,255,255)" }).promise;
      pages.push({
        index,
        label: labels[index - 1] ?? `Page ${index}`,
        dataUrl: canvas.toDataURL("image/jpeg", 0.86),
        width: canvas.width,
        height: canvas.height,
      });
      page.cleanup();
    }
  } finally {
    await pdf.destroy();
  }
  return pages;
}
