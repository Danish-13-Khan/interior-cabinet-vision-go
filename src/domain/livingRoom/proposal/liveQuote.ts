import { cabinetProjectFromInteriorProject } from "../../interiorProject";
import type { InteriorProject } from "../../interiorProject";
import { createProjectReport } from "../../projectReport";
import { createQuoteSnapshotFromQuote } from "../../projectQuote";
import { clampQuoteSnapshot, type QuoteSnapshot } from "../../quoteSettings";
import { ratesFingerprintFromBook } from "../../quoteExport";
import { readProposalCommercial } from "./commercialState";
import { createQuoteDesignFingerprint } from "./quoteFingerprint";
import { isQuoteStale, quoteStaleReason } from "./staleQuote";
import type { LiveInteriorQuote } from "./types";
import type { LiveQuoteOptions } from "./liveQuoteOptions";

export { createQuoteDesignFingerprint } from "./quoteFingerprint";
export type { LiveQuoteOptions } from "./liveQuoteOptions";

export function latestFrozenQuote(history: QuoteSnapshot[]): QuoteSnapshot | null {
  return history[0] ?? null;
}

export function freezeLiveQuote(
  document: InteriorProject,
  now = new Date().toISOString(),
  snapshotId?: string,
  options: LiveQuoteOptions = {},
): QuoteSnapshot {
  const live = buildLiveInteriorQuote(document, now, options);
  const ratesFingerprint = ratesFingerprintFromBook(
    { quote: live.quote.settings },
    options.priceBook,
  );
  const snapshot = clampQuoteSnapshot({
    ...createQuoteSnapshotFromQuote(live.quote),
    ...(snapshotId ? { id: snapshotId } : {}),
    quotedAt: now,
    designFingerprint: live.fingerprint,
    ratesFingerprint,
    priceBookUpdatedAt: options.priceBook?.updatedAt,
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
  options: LiveQuoteOptions = {},
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
    undefined,
    { priceBook: options.priceBook ?? null },
  );
  const fingerprint = createQuoteDesignFingerprint(document, options);
  const frozen = latestFrozenQuote(commercial.quoteHistory);
  const ratesFingerprint = ratesFingerprintFromBook(
    { quote: commercial.quote },
    options.priceBook,
  );
  const stale = isQuoteStale(frozen, fingerprint, report.quote, ratesFingerprint);
  return {
    quote: report.quote,
    fingerprint,
    frozen,
    stale,
    staleReason: quoteStaleReason(frozen, fingerprint, report.quote, ratesFingerprint),
    missingRate: report.quote.cabinetLines.length > 0 && report.quote.sellTotal === 0,
  };
}
