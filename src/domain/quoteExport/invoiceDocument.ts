import type { QuoteSnapshot } from "../quoteSettings";
import { formatPdfMoney } from "../quoteSettings";
import { clampInvoiceBranding, type InvoiceBranding } from "./branding";

export type InvoiceTemplateDocument = {
  title: string;
  sellerName: string;
  sellerGstin: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerEmail: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  projectNumber: string;
  revision: string;
  currencyLabel: string;
  taxLabel: string;
  lines: Array<{ label: string; amount: number; amountLabel: string }>;
  sellTotal: number;
  sellTotalLabel: string;
  bankNote: string;
  disclaimer: string;
  snapshotId: string;
  fileName: string;
};

function sanitizeToken(value: string) {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "invoice";
}

export function buildInvoiceTemplateDocument(args: {
  branding: Partial<InvoiceBranding>;
  frozen: QuoteSnapshot;
  projectName?: string;
}): InvoiceTemplateDocument {
  const branding = clampInvoiceBranding(args.branding);
  const sellerName = branding.legalName || branding.tradeName || "Your company";
  const currency = args.frozen.currencyLabel ?? "INR";
  const taxLabel = args.frozen.taxLabel ?? "GST";
  const invoiceNumber =
    branding.invoiceNumber ||
    `INV-${sanitizeToken(args.frozen.projectNumber || args.frozen.id).slice(0, 24)}`;
  const invoiceDate =
    branding.invoiceDate ||
    (args.frozen.quotedAt ? new Date(args.frozen.quotedAt).toLocaleDateString() : "");
  const lines = args.frozen.summaryLines.map((line) => ({
    label: line.label,
    amount: line.amount,
    amountLabel: formatPdfMoney(line.amount, currency),
  }));
  const fileName = `${sanitizeToken(invoiceNumber)}.pdf`;
  return {
    title: "Tax invoice (template)",
    sellerName,
    sellerGstin: branding.gstin,
    sellerAddress: branding.address,
    sellerPhone: branding.phone,
    sellerEmail: branding.email,
    invoiceNumber,
    invoiceDate,
    customerName: args.frozen.customerName || "Client",
    projectNumber: args.frozen.projectNumber || "—",
    revision: args.frozen.revision,
    currencyLabel: currency,
    taxLabel,
    lines,
    sellTotal: args.frozen.sellTotal,
    sellTotalLabel: formatPdfMoney(args.frozen.sellTotal, currency),
    bankNote: branding.bankNote,
    disclaimer:
      "Template export only. Payment is collected outside this software. Amounts match the frozen quote revision.",
    snapshotId: args.frozen.id,
    fileName,
  };
}
