import { describe, expect, it } from "vitest";
import {
  buildProposalDocument,
  createFrozenGoldenProposalProject,
  exportProposalPdf,
  goldenProposalViewFrames,
  verifyProposalPdf,
} from ".";
import {
  GOLDEN_PROPOSAL_PAGE_COUNT,
  verifyProposalPdfPages,
} from "./proposalVerifyPages";

const NOW = "2026-08-30T10:00:00.000Z";

describe("proposal PDF", () => {
  it("writes a readable branded PDF that matches the frozen quote", async () => {
    const project = createFrozenGoldenProposalProject(NOW);
    const proposal = buildProposalDocument(project, { now: NOW });
    const frames = goldenProposalViewFrames(project);
    const blob = await exportProposalPdf(proposal, frames);
    expect(frames.length).toBeGreaterThan(0);
    expect(blob.size).toBeGreaterThan(500);
    const check = await verifyProposalPdf(blob, proposal);
    expect(check.missing).toEqual([]);
    expect(check.ok).toBe(true);
    const pages = await verifyProposalPdfPages(blob, proposal, {
      expectedPageCount: GOLDEN_PROPOSAL_PAGE_COUNT,
      expectedViewImages: frames.length,
    });
    expect(pages.pageCount).toBe(GOLDEN_PROPOSAL_PAGE_COUNT);
    expect(pages.pages).toHaveLength(GOLDEN_PROPOSAL_PAGE_COUNT);
    expect(pages.pages.every((page) => page.nonblank && page.a4 && !page.clipped)).toBe(true);
    expect(pages.pages.some((page) => page.hasViewInk && page.imagePaintCount > 0)).toBe(true);
    const approvalPage = pages.pages.findIndex((page) => page.text.includes("Approval"));
    const signaturePage = pages.pages.findIndex((page) => page.text.includes("Customer signature"));
    expect(approvalPage).toBeGreaterThanOrEqual(0);
    expect(approvalPage).toBe(signaturePage);
    expect(pages.pages[0]?.minFontPt).toBeGreaterThanOrEqual(7);
    expect(proposal.sellTotal).toBeGreaterThan(0);
    expect(proposal.cabinets.length).toBe(proposal.summaryLines.length > 0
      ? proposal.cabinets.length
      : 0);
  });

  it("fails raster verification when golden view images are omitted", async () => {
    const project = createFrozenGoldenProposalProject(NOW);
    const proposal = buildProposalDocument(project, { now: NOW });
    const pages = await verifyProposalPdfPages(await exportProposalPdf(proposal), proposal, {
      expectedViewImages: 1,
    });
    expect(pages.ok).toBe(false);
    expect(pages.missing.some((item) => item.includes("view-image"))).toBe(true);
  });

  it("labels draft and stale proposals and keeps itemized prices client-facing", async () => {
    const project = createFrozenGoldenProposalProject(NOW);
    const proposal = buildProposalDocument(project, { now: NOW });
    const itemized = { ...proposal, priceDetail: "itemized" as const };
    const blob = await exportProposalPdf(itemized);
    const check = await verifyProposalPdf(blob, itemized);
    expect(check.ok).toBe(true);

    const draft = { ...proposal, draft: true, quoteSnapshotId: "draft" };
    const draftCheck = await verifyProposalPdf(await exportProposalPdf(draft), draft);
    expect(draftCheck.ok).toBe(true);

    const stale = { ...proposal, staleDisclosed: true };
    const staleCheck = await verifyProposalPdf(await exportProposalPdf(stale), stale);
    expect(staleCheck.ok).toBe(true);
  });

  it("fails raster verification for a blank single page", async () => {
    const project = createFrozenGoldenProposalProject(NOW);
    const proposal = buildProposalDocument(project, { now: NOW });
    const blank = new Blob([
      "%PDF-1.3\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595.28 841.89]/Contents 4 0 R>>endobj\n4 0 obj<</Length 0>>stream\nendstream\nendobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
    ], { type: "application/pdf" });
    const pages = await verifyProposalPdfPages(blank, proposal);
    expect(pages.pageCount).toBe(1);
    expect(pages.ok).toBe(false);
    expect(pages.missing.some((item) => item.startsWith("blank-page"))).toBe(true);
  });
});
