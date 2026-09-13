import { createQuoteSnapshotId, type QuoteSnapshot } from "./quoteSettings";
import type { ProjectQuote } from "./projectQuote";

/**
 * Freeze a live quote into an issued snapshot, including its own per-line detail so
 * the issued document stays as traceable as the draft. Snapshots are never rebuilt
 * from live data afterwards.
 */
export function createQuoteSnapshotFromQuote(quote: ProjectQuote): QuoteSnapshot {
  return {
    id: createQuoteSnapshotId(),
    revision: quote.job.revision,
    quotedAt: quote.quotedAt,
    customerName: quote.job.customerName,
    projectNumber: quote.job.projectNumber,
    workshopTotal: quote.workshopSubtotal,
    sellTotal: quote.sellTotal,
    cabinetCount: quote.cabinetLines.length,
    markupPercent: quote.settings.markupPercent,
    taxPercent: quote.settings.taxPercent,
    discountPercent: quote.settings.discountPercent,
    finishPremiumPercent: quote.settings.finishPremiumPercent,
    labourAllowance: quote.labourAllowance,
    hardwareAllowance: quote.hardwareAllowance,
    summaryLines: quote.summaryCards,
    detailLines: quote.estimateLines.map((line) => ({
      kind: line.kind,
      label: line.label,
      amount: line.amount,
      ...(line.detail ? { detail: line.detail } : {}),
    })),
  };
}
