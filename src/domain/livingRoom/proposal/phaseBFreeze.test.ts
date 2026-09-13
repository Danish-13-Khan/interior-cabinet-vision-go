import { describe, expect, it } from "vitest";
import { createDefaultPriceBook } from "../../priceBook";
import { UNAVAILABLE_ENTITLEMENTS, entitlementsForPlan } from "../../saas/entitlements";
import {
  buildLiveInteriorQuote,
  createGoldenProposalProject,
  freezeProposal,
  issuedQuoteIntact,
  patchProposalQuoteSettings,
  readProposalCommercial,
  tryFreezeProposal,
} from ".";

const NOW = "2026-09-13T00:00:00.000Z";

describe("Phase B proposal freeze + revisions", () => {
  it("denies freeze when entitlements are inactive", () => {
    const project = createGoldenProposalProject(NOW);
    const denied = tryFreezeProposal(project, {
      now: NOW,
      entitlements: UNAVAILABLE_ENTITLEMENTS,
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.reason).toMatch(/paid plan/i);
  });

  it("freezes with rates fingerprint and keeps prior issued snapshot intact", () => {
    const project = createGoldenProposalProject(NOW);
    const book = createDefaultPriceBook("phase-b");
    const result = tryFreezeProposal(project, {
      now: NOW,
      entitlements: entitlementsForPlan("designer"),
      priceBook: book,
      bumpRevisionWhenStale: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const firstId = readProposalCommercial(result.document).quoteHistory[0]!.id;
    const firstTotal = readProposalCommercial(result.document).quoteHistory[0]!.sellTotal;
    expect(readProposalCommercial(result.document).quoteHistory[0]!.ratesFingerprint).toBeTruthy();

    const stale = patchProposalQuoteSettings(result.document, { markupPercent: 30 });
    const refrozen = tryFreezeProposal(stale, {
      now: "2026-09-14T00:00:00.000Z",
      entitlements: entitlementsForPlan("designer"),
      priceBook: book,
      bumpRevisionWhenStale: true,
    });
    expect(refrozen.ok).toBe(true);
    if (!refrozen.ok) return;
    const history = readProposalCommercial(refrozen.document).quoteHistory;
    expect(history).toHaveLength(2);
    expect(history[1]?.id).toBe(firstId);
    expect(history[1]?.sellTotal).toBe(firstTotal);
    expect(history[0]?.revision).not.toBe(history[1]?.revision);
    expect(issuedQuoteIntact(refrozen.document, firstId)).toBe(true);
  });

  it("marks stale when price book rates drift after freeze", () => {
    const project = createGoldenProposalProject(NOW);
    let book = createDefaultPriceBook("phase-b-rates");
    const frozen = freezeProposal(project, NOW, undefined, { priceBook: book });
    const liveOk = buildLiveInteriorQuote(frozen, NOW, { priceBook: book });
    expect(liveOk.stale).toBe(false);

    const firstBoard = book.boards[0];
    book = {
      ...book,
      boards: book.boards.map((row) =>
        row.materialId === firstBoard.materialId && row.thicknessMm === firstBoard.thicknessMm
          ? { ...row, costPerM2: row.costPerM2 + 250 }
          : row,
      ),
      updatedAt: "2026-09-13T02:00:00.000Z",
    };
    const live = buildLiveInteriorQuote(frozen, NOW, { priceBook: book });
    expect(live.stale).toBe(true);
    expect(live.staleReason).toMatch(/rate|differ|total/i);
    expect(live.frozen?.sellTotal).toBe(liveOk.frozen?.sellTotal);
  });
});
