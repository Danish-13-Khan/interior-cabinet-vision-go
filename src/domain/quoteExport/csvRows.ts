import type { ProjectQuote } from "../projectQuote";
import { csvFromProjectQuote } from "../projectQuote";
import type { BoqViews } from "../boq";
import { csvFromBoqViews } from "../boq";
import type { QuoteSnapshot } from "../quoteSettings";
import { csvRowToLine } from "../../utils/csvSafe";

export { csvFromProjectQuote, csvFromBoqViews };

export function csvFromFrozenSnapshot(snapshot: QuoteSnapshot): string {
  const rows = [
    ["Field", "Value"],
    ["Snapshot id", snapshot.id],
    ["Revision", snapshot.revision],
    ["Quoted at", snapshot.quotedAt],
    ["Customer", snapshot.customerName],
    ["Project", snapshot.projectNumber],
    ["Workshop total", String(snapshot.workshopTotal)],
    ["Sell total", String(snapshot.sellTotal)],
    ["Cabinet count", String(snapshot.cabinetCount)],
    ["Rates fingerprint", snapshot.ratesFingerprint ?? ""],
    ...snapshot.summaryLines.map((line) => [line.label, String(line.amount)]),
    ...(snapshot.detailLines?.length
      ? [
          [],
          ["Issued line", "Amount", "Detail", "Kind"],
          ...snapshot.detailLines.map((line) => [
            line.label,
            String(line.amount),
            line.detail ?? "",
            line.kind,
          ]),
        ]
      : [["Issued line detail", "Not captured on this revision"]]),
  ];
  return rows.map(csvRowToLine).join("\n");
}

export function csvBundleFromQuoteAndBoq(
  quote: ProjectQuote,
  boq: BoqViews,
): { quoteCsv: string; boqCsv: string } {
  return {
    quoteCsv: csvFromProjectQuote(quote),
    boqCsv: csvFromBoqViews(boq),
  };
}
