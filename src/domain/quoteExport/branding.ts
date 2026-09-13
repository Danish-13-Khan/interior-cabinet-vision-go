/**
 * Seller branding for invoice / quote file exports (their document, not ours).
 * File generation only — no payment processing.
 */

export type InvoiceBranding = {
  legalName: string;
  tradeName: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  invoiceNumber: string;
  invoiceDate: string;
  bankNote: string;
};

export const DEFAULT_INVOICE_BRANDING: InvoiceBranding = {
  legalName: "",
  tradeName: "",
  gstin: "",
  address: "",
  phone: "",
  email: "",
  invoiceNumber: "",
  invoiceDate: "",
  bankNote: "",
};

export function clampInvoiceBranding(
  value: Partial<InvoiceBranding> | undefined,
): InvoiceBranding {
  const seed = { ...DEFAULT_INVOICE_BRANDING, ...(value ?? {}) };
  return {
    legalName: String(seed.legalName ?? "").trim().slice(0, 120),
    tradeName: String(seed.tradeName ?? "").trim().slice(0, 120),
    gstin: String(seed.gstin ?? "").trim().slice(0, 20),
    address: String(seed.address ?? "").trim().slice(0, 240),
    phone: String(seed.phone ?? "").trim().slice(0, 40),
    email: String(seed.email ?? "").trim().slice(0, 80),
    invoiceNumber: String(seed.invoiceNumber ?? "").trim().slice(0, 40),
    invoiceDate: String(seed.invoiceDate ?? "").trim().slice(0, 40),
    bankNote: String(seed.bankNote ?? "").trim().slice(0, 200),
  };
}
