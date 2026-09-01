import type { ProjectQuote } from "../../projectQuote";
import type { QuoteSnapshot } from "../../quoteSettings";

export function isQuoteStale(
  frozen: QuoteSnapshot | null,
  liveFingerprint: string,
  liveQuote: ProjectQuote,
): boolean {
  return quoteStaleReason(frozen, liveFingerprint, liveQuote) != null;
}

export function quoteStaleReason(
  frozen: QuoteSnapshot | null,
  liveFingerprint: string,
  liveQuote: ProjectQuote,
): string | null {
  if (!frozen) return null;
  if (frozen.designFingerprint && frozen.designFingerprint !== liveFingerprint) {
    return "The live design or commercial settings differ from the frozen quote.";
  }
  if (frozen.sellTotal !== liveQuote.sellTotal) {
    return "The live total no longer matches the frozen quote.";
  }
  if (frozen.cabinetCount !== liveQuote.cabinetLines.length) {
    return "Cabinet count changed after the quote was frozen.";
  }
  if (frozen.revision !== liveQuote.job.revision) {
    return "Revision changed after the quote was frozen.";
  }
  return null;
}
