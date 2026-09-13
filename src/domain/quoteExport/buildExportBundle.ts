import type { ProjectReport } from "../projectReport";
import type { QuoteSnapshot } from "../quoteSettings";
import { buildBoqFromReport } from "../boq";
import { clampInvoiceBranding, type InvoiceBranding } from "./branding";
import { csvBundleFromQuoteAndBoq, csvFromFrozenSnapshot } from "./csvRows";
import { excelXmlFromQuoteAndBoq } from "./excelXml";
import { buildInvoiceTemplateDocument } from "./invoiceDocument";
import { exportInvoiceTemplatePdf } from "./invoicePdf";
import { jsonFromInvoiceTemplate, jsonFromQuoteExport } from "./jsonExport";

export type CommercialExportBundle = {
  /** Built from the CURRENT design and rates, not from the frozen snapshot. */
  liveQuoteCsv: string;
  /** Built from the CURRENT cutlist, not from the frozen snapshot. */
  liveBoqCsv: string;
  /**
   * Issued quote as frozen, including its own per-line detail. Snapshots taken
   * before `detailLines` existed export totals only and say so on the sheet.
   */
  frozenCsv: string | null;
  excelXml: string;
  quoteJson: string;
  invoiceJson: string | null;
  /**
   * Set when the live report no longer matches the frozen snapshot, so a caller
   * never presents live line detail under an issued-quote heading (spec §6).
   */
  liveDivergesFromFrozen: string | null;
};

function divergenceFromFrozen(
  report: ProjectReport,
  frozen: QuoteSnapshot | null,
): string | null {
  if (!frozen) return null;
  const liveCabinets = report.quote.cabinetLines.length;
  if (
    frozen.sellTotal === report.quote.sellTotal &&
    frozen.cabinetCount === liveCabinets
  ) {
    return null;
  }
  return (
    `Live design/rates differ from issued revision ${frozen.revision}. ` +
    `Quote and BOQ sheets show current figures; only the frozen sheet is the issued quote.`
  );
}

export function buildCommercialExportBundle(args: {
  report: ProjectReport;
  frozen?: QuoteSnapshot | null;
  branding?: Partial<InvoiceBranding>;
  exportedAt?: string;
}): CommercialExportBundle {
  const boq = buildBoqFromReport(args.report);
  const csv = csvBundleFromQuoteAndBoq(args.report.quote, boq);
  const frozen = args.frozen ?? args.report.quoteHistory[0] ?? null;
  return {
    liveQuoteCsv: csv.quoteCsv,
    liveBoqCsv: csv.boqCsv,
    frozenCsv: frozen ? csvFromFrozenSnapshot(frozen) : null,
    liveDivergesFromFrozen: divergenceFromFrozen(args.report, frozen),
    excelXml: excelXmlFromQuoteAndBoq({
      quote: args.report.quote,
      boq,
      frozen,
    }),
    quoteJson: jsonFromQuoteExport({
      quote: args.report.quote,
      frozen,
      boq,
      exportedAt: args.exportedAt,
    }),
    invoiceJson: frozen
      ? jsonFromInvoiceTemplate({
          branding: clampInvoiceBranding(args.branding ?? {}),
          frozen,
          exportedAt: args.exportedAt,
        })
      : null,
  };
}

export async function buildInvoiceTemplateFiles(args: {
  frozen: QuoteSnapshot;
  branding: Partial<InvoiceBranding>;
}): Promise<{ pdf: Blob; json: string; fileName: string }> {
  const document = buildInvoiceTemplateDocument(args);
  const pdf = await exportInvoiceTemplatePdf(document);
  return {
    pdf,
    json: jsonFromInvoiceTemplate({
      branding: clampInvoiceBranding(args.branding),
      frozen: args.frozen,
    }),
    fileName: document.fileName,
  };
}
