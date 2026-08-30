import { describe, expect, it } from "vitest";
import { DEFAULT_QUOTE_SETTINGS } from "../../quoteSettings";
import {
  appendFrozenQuote,
  buildLiveInteriorQuote,
  createGoldenProposalProject,
  freezeLiveQuote,
  patchProposalQuoteSettings,
} from ".";

const NOW = "2026-08-30T10:00:00.000Z";

describe("proposal live quote and freeze", () => {
  it("shows a live estimated total with currency and tax labels", () => {
    const project = createGoldenProposalProject(NOW);
    const live = buildLiveInteriorQuote(project, NOW);
    expect(live.quote.cabinetLines.length).toBeGreaterThan(0);
    expect(live.quote.sellTotal).toBeGreaterThan(0);
    expect(live.quote.settings.currencyLabel).toBe("INR");
    expect(live.quote.settings.taxLabel).toBe("GST");
    expect(live.frozen).toBeNull();
    expect(live.stale).toBe(false);
  });

  it("freezes an immutable snapshot that reproduces the live total", () => {
    const project = createGoldenProposalProject(NOW);
    const live = buildLiveInteriorQuote(project, NOW);
    const snapshot = freezeLiveQuote(project, NOW);
    expect(snapshot.sellTotal).toBe(live.quote.sellTotal);
    expect(snapshot.cabinetCount).toBe(live.quote.cabinetLines.length);
    expect(snapshot.designFingerprint).toBe(live.fingerprint);
    expect(snapshot.inclusions).toBe(DEFAULT_QUOTE_SETTINGS.inclusions);
    const frozen = appendFrozenQuote(project, snapshot);
    const again = buildLiveInteriorQuote(frozen, NOW);
    expect(again.frozen?.id).toBe(snapshot.id);
    expect(again.stale).toBe(false);
    expect(again.quote.sellTotal).toBe(snapshot.sellTotal);
  });

  it("marks the quote stale after a commercial or design change", () => {
    const project = createGoldenProposalProject(NOW);
    const frozen = appendFrozenQuote(project, freezeLiveQuote(project, NOW));
    const next = patchProposalQuoteSettings(frozen, { markupPercent: 28 });
    const live = buildLiveInteriorQuote(next, NOW);
    expect(live.stale).toBe(true);
    expect(live.staleReason).toMatch(/differ|total/i);
    expect(live.quote.sellTotal).not.toBe(live.frozen?.sellTotal);
  });

  it("marks the quote stale after a cabinet is moved", () => {
    const project = createGoldenProposalProject(NOW);
    const frozen = appendFrozenQuote(project, freezeLiveQuote(project, NOW));
    const cabinet = frozen.objects.find((object) => object.kind === "cabinet");
    expect(cabinet).toBeTruthy();
    const moved = {
      ...frozen,
      objects: frozen.objects.map((object) =>
        object.id === cabinet!.id
          ? { ...object, position: { ...object.position, x: object.position.x + 400 } }
          : object,
      ),
    };
    const live = buildLiveInteriorQuote(moved, NOW);
    expect(live.stale).toBe(true);
    expect(live.quote.sellTotal).toBe(live.frozen?.sellTotal);
    expect(live.staleReason).toMatch(/design|differ/i);
  });

  it("clamps discount so it cannot silently exceed bounds", () => {
    const project = patchProposalQuoteSettings(
      createGoldenProposalProject(NOW),
      { discountPercent: 95 },
    );
    const live = buildLiveInteriorQuote(project, NOW);
    expect(live.quote.settings.discountPercent).toBe(40);
  });
});
