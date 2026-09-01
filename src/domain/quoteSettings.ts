export type QuotePriceDetail = "summary" | "itemized";

export type QuoteSettings = {
  markupPercent: number;
  taxPercent: number;
  discountPercent: number;
  validityDays: number;
  labourAllowance: number;
  finishPremiumPercent: number;
  inclusions: string;
  exclusions: string;
  currencyLabel: string;
  taxLabel: string;
  priceDetail: QuotePriceDetail;
};

export const DEFAULT_QUOTE_SETTINGS: QuoteSettings = {
  markupPercent: 18,
  taxPercent: 18,
  discountPercent: 0,
  validityDays: 30,
  labourAllowance: 0,
  finishPremiumPercent: 10,
  inclusions: "Cabinets, hardware, and specified finishes as shown.",
  exclusions: "Site installation, appliances, plumbing, and electrical not included.",
  currencyLabel: "INR",
  taxLabel: "GST",
  priceDetail: "summary",
};

export function clampQuoteSettings(
  settings: Partial<QuoteSettings> | undefined,
): QuoteSettings {
  const seed = {
    ...DEFAULT_QUOTE_SETTINGS,
    ...(settings ?? {}),
  };

  return {
    markupPercent: Math.min(100, Math.max(0, Number(seed.markupPercent) || 0)),
    taxPercent: Math.min(40, Math.max(0, Number(seed.taxPercent) || 0)),
    discountPercent: Math.min(40, Math.max(0, Number(seed.discountPercent) || 0)),
    validityDays: Math.min(
      365,
      Math.max(1, Math.round(Number.isFinite(Number(seed.validityDays)) ? Number(seed.validityDays) : 30)),
    ),
    labourAllowance: Math.max(0, Math.round(Number(seed.labourAllowance) || 0)),
    finishPremiumPercent: Math.min(100, Math.max(0, Number(seed.finishPremiumPercent) || 0)),
    inclusions: String(seed.inclusions ?? DEFAULT_QUOTE_SETTINGS.inclusions).trim().slice(0, 400),
    exclusions: String(seed.exclusions ?? DEFAULT_QUOTE_SETTINGS.exclusions).trim().slice(0, 400),
    currencyLabel: String(seed.currencyLabel ?? "INR").trim().slice(0, 12) || "INR",
    taxLabel: String(seed.taxLabel ?? DEFAULT_QUOTE_SETTINGS.taxLabel).trim().slice(0, 16) || "GST",
    priceDetail: seed.priceDetail === "itemized" ? "itemized" : "summary",
  };
}

export type QuoteSnapshotSummaryLine = {
  label: string;
  amount: number;
};

export type QuoteSnapshot = {
  id: string;
  revision: string;
  quotedAt: string;
  customerName: string;
  projectNumber: string;
  workshopTotal: number;
  sellTotal: number;
  cabinetCount: number;
  markupPercent: number;
  taxPercent: number;
  discountPercent: number;
  finishPremiumPercent: number;
  labourAllowance: number;
  hardwareAllowance: number;
  summaryLines: QuoteSnapshotSummaryLine[];
  designFingerprint?: string;
  currencyLabel?: string;
  taxLabel?: string;
  priceDetail?: QuotePriceDetail;
  inclusions?: string;
  exclusions?: string;
  validUntil?: string | null;
};

export const MAX_QUOTE_HISTORY = 12;

export function createQuoteSnapshotId() {
  return `quote-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function clampQuoteSnapshot(
  snapshot: Partial<QuoteSnapshot> | undefined,
): QuoteSnapshot | null {
  if (!snapshot) return null;
  const workshopTotal = Math.max(0, Math.round(Number(snapshot.workshopTotal) || 0));
  const sellTotal = Math.max(0, Math.round(Number(snapshot.sellTotal) || 0));
  if (!snapshot.id && workshopTotal === 0 && sellTotal === 0) return null;

  const summaryLines = Array.isArray(snapshot.summaryLines)
    ? snapshot.summaryLines
        .slice(0, 20)
        .map((line) => ({
          label: String(line?.label ?? "").trim().slice(0, 80) || "Line",
          amount: Math.round(Number(line?.amount) || 0),
        }))
    : [];

  return {
    id: String(snapshot.id ?? createQuoteSnapshotId()),
    revision: String(snapshot.revision ?? "A").trim() || "A",
    quotedAt: String(snapshot.quotedAt ?? new Date().toISOString()),
    customerName: String(snapshot.customerName ?? "").trim(),
    projectNumber: String(snapshot.projectNumber ?? "").trim(),
    workshopTotal,
    sellTotal,
    cabinetCount: Math.max(0, Math.round(Number(snapshot.cabinetCount) || 0)),
    markupPercent: Math.min(100, Math.max(0, Number(snapshot.markupPercent) || 0)),
    taxPercent: Math.min(40, Math.max(0, Number(snapshot.taxPercent) || 0)),
    discountPercent: Math.min(40, Math.max(0, Number(snapshot.discountPercent) || 0)),
    finishPremiumPercent: Math.min(
      100,
      Math.max(0, Number(snapshot.finishPremiumPercent) || 0),
    ),
    labourAllowance: Math.max(0, Math.round(Number(snapshot.labourAllowance) || 0)),
    hardwareAllowance: Math.max(0, Math.round(Number(snapshot.hardwareAllowance) || 0)),
    summaryLines,
    designFingerprint: snapshot.designFingerprint
      ? String(snapshot.designFingerprint).trim().slice(0, 64)
      : undefined,
    currencyLabel: snapshot.currencyLabel
      ? String(snapshot.currencyLabel).trim().slice(0, 12)
      : undefined,
    taxLabel: snapshot.taxLabel
      ? String(snapshot.taxLabel).trim().slice(0, 16)
      : undefined,
    priceDetail: snapshot.priceDetail === "itemized" ? "itemized" : snapshot.priceDetail === "summary"
      ? "summary"
      : undefined,
    inclusions: snapshot.inclusions
      ? String(snapshot.inclusions).trim().slice(0, 400)
      : undefined,
    exclusions: snapshot.exclusions
      ? String(snapshot.exclusions).trim().slice(0, 400)
      : undefined,
    validUntil: snapshot.validUntil ? String(snapshot.validUntil) : snapshot.validUntil === null
      ? null
      : undefined,
  };
}

export function clampQuoteHistory(
  history: Array<Partial<QuoteSnapshot>> | undefined,
): QuoteSnapshot[] {
  if (!Array.isArray(history)) return [];
  return history
    .map((item) => clampQuoteSnapshot(item))
    .filter((item): item is QuoteSnapshot => Boolean(item))
    .slice(0, MAX_QUOTE_HISTORY);
}

export function formatQuoteMoney(amount: number, currencyLabel = "INR") {
  const label = currencyLabel === "INR" ? "₹" : `${currencyLabel} `;
  return `${label}${Math.round(amount).toLocaleString()}`;
}

export function quoteValidUntil(quotedAt: string, validityDays: number) {
  const start = new Date(quotedAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(1, validityDays));
  return end.toISOString();
}
