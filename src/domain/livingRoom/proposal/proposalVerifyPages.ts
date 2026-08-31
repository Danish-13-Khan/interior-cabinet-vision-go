import { countPdfPages } from "./proposalPdfParse";
import { isA4MediaBox, rasterizePdfPages, type RasterizedPdfPage } from "./proposalPdfRaster";
import { pageHasInk, viewInkLooksClipped } from "./proposalPdfViewInk";
import type { ProposalDocument } from "./types";

export const GOLDEN_PROPOSAL_PAGE_COUNT = 2;
export const MIN_LEGIBLE_FONT_PT = 7;

export type ProposalPageVerifyOptions = {
  expectedPageCount?: number;
  expectedViewImages?: number;
};

export type RasterLayoutPage = {
  nonblank: boolean;
  clipped: boolean;
  a4: boolean;
  minFontPt: number | null;
  imagePaintCount: number;
  hasViewInk: boolean;
  text: string;
};

export type ProposalPageVerification = {
  ok: boolean;
  missing: string[];
  pageCount: number;
  pages: RasterLayoutPage[];
};

function approvalBlockSplit(rasters: Array<{ text: string }>) {
  const heading = rasters.findIndex((page) => page.text.includes("Approval"));
  const signatures = rasters.findIndex((page) => page.text.includes("Customer signature"));
  return heading >= 0 && signatures >= 0 && heading !== signatures;
}

/** A4, blank, clipping, and minimum font size — shared with production-packet QA. */
export function collectRasterLayoutIssues(rasters: RasterizedPdfPage[]) {
  const missing: string[] = [];
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
  return { missing, pages };
}

export function collectImagePaintGaps(rasters: RasterizedPdfPage[], expected: number) {
  if (expected <= 0) return [];
  const paints = rasters.reduce((sum, page) => sum + page.imagePaintCount, 0);
  return paints < expected ? [`missing-view-image:${paints}<${expected}`] : [];
}

function collectViewImageGaps(rasters: RasterizedPdfPage[], expected: number) {
  const missing = collectImagePaintGaps(rasters, expected);
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
  let rasters: RasterizedPdfPage[] = [];
  try {
    rasters = await rasterizePdfPages(bytes);
  } catch {
    missing.push("pdf-render-failed");
  }
  const pageCount = rasters.length || countPdfPages(bytes);
  if (options.expectedPageCount != null && pageCount !== options.expectedPageCount) {
    missing.push(`page-count:${pageCount}!=${options.expectedPageCount}`);
  }
  const layout = collectRasterLayoutIssues(rasters);
  missing.push(...layout.missing);
  const cover = rasters[0];
  if (cover?.inkBounds && cover.inkBounds.minY / cover.scale > 90) {
    missing.push("missing-header-band");
  }
  if (approvalBlockSplit(rasters)) missing.push("split-approval-block");
  if (proposal.views.length && !rasters.length) missing.push("no-raster-pages");
  if ((options.expectedViewImages ?? 0) > 0) {
    missing.push(...collectViewImageGaps(rasters, options.expectedViewImages ?? 0));
  }
  return { ok: missing.length === 0, missing, pageCount, pages: layout.pages };
}
