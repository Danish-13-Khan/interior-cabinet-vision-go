import type { ProjectReport } from "../projectReport";
import type { QuoteSnapshot } from "../quoteSettings";
import { buildBoqFromReport } from "../boq";
import type { InvoiceBranding } from "./branding";
import { csvBundleFromQuoteAndBoq, csvFromFrozenSnapshot } from "./csvRows";
import { excelXmlFromQuoteAndBoq } from "./excelXml";
import { buildInvoiceTemplateDocument } from "./invoiceDocument";
import { exportInvoiceTemplatePdf } from "./invoicePdf";
import { jsonFromInvoiceTemplate, jsonFromQuoteExport } from "./jsonExport";

export type CommercialExportBundle = {
  quoteCsv: string;
  boqCsv: string;
  frozenCsv: string | null;
  excelXml: string;
  quoteJson: string;
  invoiceJson: string | null;
};

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
    quoteCsv: csv.quoteCsv,
    boqCsv: csv.boqCsv,
    frozenCsv: frozen ? csvFromFrozenSnapshot(frozen) : null,
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
          branding: args.branding ?? {},
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
    json: jsonFromInvoiceTemplate({ branding: args.branding, frozen: args.frozen }),
    fileName: document.fileName,
  };
}
