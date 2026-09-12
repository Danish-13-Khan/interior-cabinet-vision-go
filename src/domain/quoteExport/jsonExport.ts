import type { ProjectQuote } from "../projectQuote";
import type { QuoteSnapshot } from "../quoteSettings";
import type { BoqViews } from "../boq";
import type { InvoiceBranding } from "./branding";

export type QuoteExportJson = {
  schemaVersion: 1;
  kind: "quote-export";
  exportedAt: string;
  quote: ProjectQuote;
  frozen: QuoteSnapshot | null;
  boq: BoqViews;
};

export type InvoiceExportJson = {
  schemaVersion: 1;
  kind: "invoice-template";
  exportedAt: string;
  branding: InvoiceBranding;
  frozen: QuoteSnapshot;
  status: "invoiced";
};

export function jsonFromQuoteExport(payload: Omit<QuoteExportJson, "schemaVersion" | "kind" | "exportedAt"> & {
  exportedAt?: string;
}): string {
  const body: QuoteExportJson = {
    schemaVersion: 1,
    kind: "quote-export",
    exportedAt: payload.exportedAt ?? new Date().toISOString(),
    quote: payload.quote,
    frozen: payload.frozen,
    boq: payload.boq,
  };
  return `${JSON.stringify(body, null, 2)}\n`;
}

export function jsonFromInvoiceTemplate(args: {
  branding: InvoiceBranding;
  frozen: QuoteSnapshot;
  exportedAt?: string;
}): string {
  const body: InvoiceExportJson = {
    schemaVersion: 1,
    kind: "invoice-template",
    exportedAt: args.exportedAt ?? new Date().toISOString(),
    branding: args.branding,
    frozen: args.frozen,
    status: "invoiced",
  };
  return `${JSON.stringify(body, null, 2)}\n`;
}
