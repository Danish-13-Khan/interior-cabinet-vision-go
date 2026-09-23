export type IssuedQuoteView = {
  revision: string;
  sellTotal: number;
  quotedAt: string;
};

export type QuoteComparisonView = {
  designRevision: string;
  currency: string;
  workshop: number;
  markupPercent: number;
  markup: number;
  taxLabel: string;
  taxPercent: number;
  tax: number;
  validityDays: number;
  validUntil: string | null;
  currentSell: number;
  issued: IssuedQuoteView | null;
  stale: boolean;
  staleReason: string | null;
};

export function quoteComparisonView(input: {
  designRevision: string;
  currency: string;
  workshop: number;
  markupPercent: number;
  markup: number;
  taxLabel: string;
  taxPercent: number;
  tax: number;
  validityDays: number;
  validUntil: string | null;
  currentSell: number;
  issued: IssuedQuoteView | null;
  stale: boolean;
  staleReason: string | null;
}): QuoteComparisonView {
  return { ...input };
}

export function quoteIssuedMatchesCurrent(view: QuoteComparisonView) {
  return Boolean(view.issued) && !view.stale && view.issued?.sellTotal === view.currentSell;
}
