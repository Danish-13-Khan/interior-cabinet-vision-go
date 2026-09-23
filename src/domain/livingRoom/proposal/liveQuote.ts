import type { InteriorProject } from "../../interiorProject";
import { buildProjectQuote, createQuoteSnapshotFromQuote } from "../../projectQuote";
import { interiorEstimateSummary } from "../../interiorEstimate/measure";
import { interiorRateLookup } from "../../priceBook";
import { clampQuoteSnapshot, type QuoteSnapshot } from "../../quoteSettings";
import { ratesFingerprintFromBook } from "../../quoteExport";
import { readProposalCommercial } from "./commercialState";
import { createInteriorQuoteReport } from "./interiorQuoteReport";
import { buildBoqFromReport } from "../../boq";
import { applyBoqDeltaToQuote, boqWorkshopDelta } from "../../studio/boqWorksheet";
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
  const interior = interiorEstimateSummary(document, interiorRateLookup(options.priceBook?.interiorRates ?? []));
  const report = createInteriorQuoteReport(document, now, options);
  const quote = applyBoqDeltaToQuote(
    interior.enabled ? buildProjectQuote(report.projectCost, report.quote.settings, report.quote.job, {
      quotedAt: report.quote.quotedAt,
      interiorLines: interior.lines.map((line) => ({ id: line.id, label: `${line.roomName} · ${line.label}`, amount: line.amount,
        detail: `${line.quantity} ${line.unit} × ${line.rate ?? "missing rate"}` })),
    }) : report.quote,
    boqWorkshopDelta(buildBoqFromReport(report).lines, commercial.surface.boqQuantities).delta,
  );
  const fingerprint = createQuoteDesignFingerprint(document, options);
  const frozen = latestFrozenQuote(commercial.quoteHistory);
  const ratesFingerprint = ratesFingerprintFromBook(
    { quote: commercial.quote },
    options.priceBook,
  );
  const stale = isQuoteStale(frozen, fingerprint, quote, ratesFingerprint);
  return {
    quote,
    fingerprint,
    frozen,
    stale,
    staleReason: quoteStaleReason(frozen, fingerprint, quote, ratesFingerprint),
    missingRate: interior.missing.length > 0 || (quote.cabinetLines.length > 0 && quote.sellTotal === 0),
  };
}
