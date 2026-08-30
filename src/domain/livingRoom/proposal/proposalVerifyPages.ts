import { countPdfPages } from "./proposalPdfParse";
import { isA4MediaBox, rasterizePdfPages } from "./proposalPdfRaster";
import { pageHasInk, viewInkLooksClipped } from "./proposalPdfViewInk";
import type { ProposalDocument } from "./types";

export const GOLDEN_PROPOSAL_PAGE_COUNT = 2;
const MIN_LEGIBLE_FONT_PT = 7;

export type ProposalPageVerifyOptions = {
  expectedPageCount?: number;
  expectedViewImages?: number;
};

export type ProposalPageVerification = {
  ok: boolean;
  missing: string[];
  pageCount: number;
  pages: Array<{
    nonblank: boolean;
    clipped: boolean;
    a4: boolean;
    minFontPt: number | null;
    imagePaintCount: number;
    hasViewInk: boolean;
    text: string;
  }>;
};

function approvalBlockSplit(rasters: Array<{ text: string }>) {
  const heading = rasters.findIndex((page) => page.text.includes("Approval"));
  const signatures = rasters.findIndex((page) => page.text.includes("Customer signature"));
  return heading >= 0 && signatures >= 0 && heading !== signatures;
}

function collectViewImageGaps(
  rasters: Awaited<ReturnType<typeof rasterizePdfPages>>,
  expected: number,
) {
  const missing: string[] = [];
  const paints = rasters.reduce((sum, page) => sum + page.imagePaintCount, 0);
  if (paints < expected) missing.push(`missing-view-image:${paints}<${expected}`);
  const ink = rasters.map((page) => page.viewInk).find((item) => item);
  if (!ink) {
    missing.push("blank-view-image");
    return missing;
  }
  const host = rasters.find((page) => page.viewInk);
  if (host && viewInkLooksClipped(ink, host.width, host.height)) {
    missing.push("clipped-view-image");
  }
  return missing;
}

export async function verifyProposalPdfPages(
  blob: Blob,
  proposal: ProposalDocument,
  options: ProposalPageVerifyOptions = {},
): Promise<ProposalPageVerification> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const missing: string[] = [];
  let rasters: Awaited<ReturnType<typeof rasterizePdfPages>> = [];
  try {
    rasters = await rasterizePdfPages(bytes);
  } catch {
    missing.push("pdf-render-failed");
  }
  const pageCount = rasters.length || countPdfPages(bytes);
  if (options.expectedPageCount != null && pageCount !== options.expectedPageCount) {
    missing.push(`page-count:${pageCount}!=${options.expectedPageCount}`);
  }
  const pages = rasters.map((page, index) => {
    const ink = pageHasInk(page.pixels, page.width, page.height)
      || page.minFontPt != null
      || page.imagePaintCount > 0;
    const a4 = isA4MediaBox(page.mediaBox);
    if (!ink) missing.push(`blank-page:${index + 1}`);
    if (page.clipped) missing.push(`clipped-page:${index + 1}`);
    if (!a4) missing.push(`media-box:${index + 1}`);
    if (page.minFontPt != null && page.minFontPt < MIN_LEGIBLE_FONT_PT) {
      missing.push(`illegible-font:${index + 1}:${page.minFontPt}`);
    }
    if (index === 0 && page.inkBounds && page.inkBounds.minY / page.scale > 90) {
      missing.push("missing-header-band");
    }
    return {
      nonblank: ink,
      clipped: page.clipped,
      a4,
      minFontPt: page.minFontPt,
      imagePaintCount: page.imagePaintCount,
      hasViewInk: page.viewInk != null,
      text: page.text,
    };
  });
  if (approvalBlockSplit(rasters)) missing.push("split-approval-block");
  if (proposal.views.length && !rasters.length) missing.push("no-raster-pages");
  if ((options.expectedViewImages ?? 0) > 0) {
    missing.push(...collectViewImageGaps(rasters, options.expectedViewImages ?? 0));
  }
  return { ok: missing.length === 0, missing, pageCount, pages };
}
