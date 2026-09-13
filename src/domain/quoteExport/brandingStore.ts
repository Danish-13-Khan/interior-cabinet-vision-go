import {
  clampInvoiceBranding,
  DEFAULT_INVOICE_BRANDING,
  type InvoiceBranding,
} from "./branding";

export const INVOICE_BRANDING_STORAGE_KEY = "cabinet-designer.invoice-branding.v1";

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

function defaultStorage(): StorageLike | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function readInvoiceBranding(
  storage: StorageLike | null = defaultStorage(),
): InvoiceBranding {
  if (!storage) return { ...DEFAULT_INVOICE_BRANDING };
  try {
    const raw = storage.getItem(INVOICE_BRANDING_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_INVOICE_BRANDING };
    return clampInvoiceBranding(JSON.parse(raw) as Partial<InvoiceBranding>);
  } catch {
    return { ...DEFAULT_INVOICE_BRANDING };
  }
}

export function persistInvoiceBranding(
  branding: Partial<InvoiceBranding>,
  storage: StorageLike | null = defaultStorage(),
): InvoiceBranding {
  const next = clampInvoiceBranding({ ...readInvoiceBranding(storage), ...branding });
  if (storage) {
    storage.setItem(INVOICE_BRANDING_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
