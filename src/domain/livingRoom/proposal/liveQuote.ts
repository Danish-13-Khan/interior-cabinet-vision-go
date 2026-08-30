import { cabinetProjectFromInteriorProject } from "../../interiorProject";
import type { InteriorProject } from "../../interiorProject";
import { createProjectReport } from "../../projectReport";
import { createQuoteSnapshotFromQuote } from "../../projectQuote";
import { clampQuoteSnapshot, type QuoteSnapshot } from "../../quoteSettings";
import { readProposalCommercial } from "./commercialState";
import { createQuoteDesignFingerprint } from "./quoteFingerprint";
import { isQuoteStale, quoteStaleReason } from "./staleQuote";
import type { LiveInteriorQuote } from "./types";

export { createQuoteDesignFingerprint } from "./quoteFingerprint";

export function latestFrozenQuote(history: QuoteSnapshot[]): QuoteSnapshot | null {
  return history[0] ?? null;
}

export function freezeLiveQuote(
  document: InteriorProject,
  now = new Date().toISOString(),
): QuoteSnapshot {
  const live = buildLiveInteriorQuote(document, now);
  const snapshot = clampQuoteSnapshot({
    ...createQuoteSnapshotFromQuote(live.quote),
    quotedAt: now,
    designFingerprint: live.fingerprint,
    currencyLabel: live.quote.settings.currencyLabel,
    taxLabel: live.quote.settings.taxLabel,
    priceDetail: live.quote.settings.priceDetail,
    inclusions: live.quote.settings.inclusions,
    exclusions: live.quote.settings.exclusions,
    validUntil: live.quote.validUntil,
  });
  if (!snapshot) throw new Error("Quote freeze produced an empty snapshot.");
  return snapshot;
}

export function buildLiveInteriorQuote(
  document: InteriorProject,
  now = new Date().toISOString(),
): LiveInteriorQuote {
  const commercial = readProposalCommercial(document);
  const compatible = cabinetProjectFromInteriorProject(document);
  const report = createProjectReport(
    {
      ...compatible.project,
      job: { ...commercial.job, quotedAt: commercial.job.quotedAt ?? now },
      preferences: {
        ...compatible.project.preferences,
        snapSizeMm: compatible.project.preferences?.snapSizeMm ?? 50,
        showGrid: compatible.project.preferences?.showGrid ?? true,
        autoSaveToBrowser: compatible.project.preferences?.autoSaveToBrowser ?? true,
        quote: commercial.quote,
      },
      quoteHistory: commercial.quoteHistory,
    },
    compatible.room,
  );
  const fingerprint = createQuoteDesignFingerprint(document);
  const frozen = latestFrozenQuote(commercial.quoteHistory);
  const stale = isQuoteStale(frozen, fingerprint, report.quote);
  return {
    quote: report.quote,
    fingerprint,
    frozen,
    stale,
    staleReason: quoteStaleReason(frozen, fingerprint, report.quote),
    missingRate: report.quote.cabinetLines.length > 0 && report.quote.sellTotal === 0,
  };
}
