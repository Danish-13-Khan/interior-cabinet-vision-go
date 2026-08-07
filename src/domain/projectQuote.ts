import type { ProjectCost, CabinetCost, HardwareLine } from "./costing";
import type { ProjectJobMeta } from "./jobMeta";
import { clampJobMeta, createDefaultJobMeta } from "./jobMeta";
import {
  clampQuoteSettings,
  createQuoteSnapshotId,
  DEFAULT_QUOTE_SETTINGS,
  quoteValidUntil,
  type QuoteSettings,
  type QuoteSnapshot,
  type QuoteSnapshotSummaryLine,
} from "./quoteSettings";

export type QuoteCabinetLine = {
  cabinetId: string;
  cabinetName: string;
  mark: string;
  materialCost: number;
  finishCost: number;
  finishPremium: number;
  hardwareCost: number;
  labourCost: number;
  workshopCost: number;
  sellPrice: number;
};

export type QuoteEstimateLine = {
  id: string;
  kind:
    | "cabinet"
    | "hardware-allowance"
    | "labour-allowance"
    | "finish-premium"
    | "markup"
    | "discount"
    | "tax"
    | "note";
  label: string;
  amount: number;
  detail?: string;
};

export type ProjectQuote = {
  settings: QuoteSettings;
  job: ProjectJobMeta;
  quotedAt: string;
  validUntil: string | null;
  workshopSubtotal: number;
  finishPremiumTotal: number;
  labourAllowance: number;
  hardwareAllowance: number;
  baseBeforeMarkup: number;
  markupAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  sellTotal: number;
  cabinetLines: QuoteCabinetLine[];
  estimateLines: QuoteEstimateLine[];
  hardwareRollup: HardwareLine[];
  summaryCards: QuoteSnapshotSummaryLine[];
};

function roundMoney(value: number) {
  return Math.round(value);
}

function rollupHardware(cabinets: CabinetCost[]): HardwareLine[] {
  const byId = new Map<string, HardwareLine>();
  for (const cabinet of cabinets) {
    for (const line of cabinet.hardwareLines) {
      const existing = byId.get(line.id);
      if (!existing) {
        byId.set(line.id, { ...line });
        continue;
      }
      existing.quantity += line.quantity;
      existing.totalCost += line.totalCost;
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.totalCost - a.totalCost);
}

export function buildProjectQuote(
  projectCost: ProjectCost,
  quoteSettings: Partial<QuoteSettings> | undefined,
  job: ProjectJobMeta | undefined,
  options: {
    quotedAt?: string;
    cabinetMarks?: Map<string, string>;
  } = {},
): ProjectQuote {
  const settings = clampQuoteSettings(quoteSettings ?? DEFAULT_QUOTE_SETTINGS);
  const safeJob = clampJobMeta(job ?? createDefaultJobMeta());
  const quotedAt = options.quotedAt ?? new Date().toISOString();

  const finishPremiumTotal = roundMoney(
    projectCost.cabinets.reduce(
      (sum, cabinet) =>
        sum + cabinet.finishCost * (settings.finishPremiumPercent / 100),
      0,
    ),
  );
  const labourAllowance = settings.labourAllowance;
  const hardwareAllowance = projectCost.hardwareAllowance;
  const workshopSubtotal = projectCost.grandTotal;
  const baseBeforeMarkup = roundMoney(
    workshopSubtotal + finishPremiumTotal + labourAllowance,
  );
  const markupAmount = roundMoney(baseBeforeMarkup * (settings.markupPercent / 100));
  const afterMarkup = baseBeforeMarkup + markupAmount;
  const discountAmount = roundMoney(afterMarkup * (settings.discountPercent / 100));
  const taxableAmount = roundMoney(afterMarkup - discountAmount);
  const taxAmount = roundMoney(taxableAmount * (settings.taxPercent / 100));
  const sellTotal = roundMoney(taxableAmount + taxAmount);

  const cabinetLines: QuoteCabinetLine[] = projectCost.cabinets.map((cabinet, index) => {
    const finishPremium = roundMoney(
      cabinet.finishCost * (settings.finishPremiumPercent / 100),
    );
    const workshopCost = cabinet.totalCost;
    const sellPrice = roundMoney(workshopCost);
    return {
      cabinetId: cabinet.cabinetId,
      cabinetName: cabinet.cabinetName,
      mark:
        options.cabinetMarks?.get(cabinet.cabinetId) ??
        `C${String(index + 1).padStart(2, "0")}`,
      materialCost: cabinet.materialCost,
      finishCost: cabinet.finishCost,
      finishPremium,
      hardwareCost: cabinet.hardwareCost,
      labourCost: cabinet.labourCost,
      workshopCost,
      sellPrice,
    };
  });

  // Cabinet estimate lines should represent the workshop subtotal minus any project-wide
  // hardware allowance that is shown as a separate estimate line below.
  const cabinetSellSum = cabinetLines.reduce((sum, line) => sum + line.sellPrice, 0);
  const targetCabinetSell = roundMoney(
    workshopSubtotal - hardwareAllowance,
  );
  if (cabinetSellSum > 0 && targetCabinetSell > 0) {
    const scale = targetCabinetSell / cabinetSellSum;
    for (const line of cabinetLines) {
      line.sellPrice = roundMoney(line.sellPrice * scale);
    }
  }

  const estimateLines: QuoteEstimateLine[] = [
    ...cabinetLines.map((line) => ({
      id: `cabinet-${line.cabinetId}`,
      kind: "cabinet" as const,
      label: `${line.mark} · ${line.cabinetName}`,
      amount: line.sellPrice,
      detail: `Workshop ${line.workshopCost.toLocaleString()} · finish premium ${line.finishPremium.toLocaleString()}`,
    })),
  ];

  if (hardwareAllowance > 0) {
    estimateLines.push({
      id: "hardware-allowance",
      kind: "hardware-allowance",
      label: "Hardware allowance",
      amount: hardwareAllowance,
    });
  }
  if (labourAllowance > 0) {
    estimateLines.push({
      id: "labour-allowance",
      kind: "labour-allowance",
      label: "Labour allowance",
      amount: labourAllowance,
    });
  }
  if (finishPremiumTotal > 0) {
    estimateLines.push({
      id: "finish-premium",
      kind: "finish-premium",
      label: `Finish premium (${settings.finishPremiumPercent}%)`,
      amount: finishPremiumTotal,
      detail: "Applied on finish surface costs",
    });
  }
  if (markupAmount > 0) {
    estimateLines.push({
      id: "markup",
      kind: "markup",
      label: `Markup (${settings.markupPercent}%)`,
      amount: markupAmount,
    });
  }
  if (discountAmount > 0) {
    estimateLines.push({
      id: "discount",
      kind: "discount",
      label: `Discount (${settings.discountPercent}%)`,
      amount: -discountAmount,
    });
  }
  if (taxAmount > 0) {
    estimateLines.push({
      id: "tax",
      kind: "tax",
      label: `Tax (${settings.taxPercent}%)`,
      amount: taxAmount,
    });
  }

  const summaryCards: QuoteSnapshotSummaryLine[] = [
    { label: "Workshop cost", amount: workshopSubtotal },
    { label: "Finish premium", amount: finishPremiumTotal },
    { label: "Labour allowance", amount: labourAllowance },
    { label: "Markup", amount: markupAmount },
    { label: "Discount", amount: discountAmount },
    { label: "Tax", amount: taxAmount },
    { label: "Quote total", amount: sellTotal },
  ];

  return {
    settings,
    job: safeJob,
    quotedAt,
    validUntil: quoteValidUntil(quotedAt, settings.validityDays),
    workshopSubtotal,
    finishPremiumTotal,
    labourAllowance,
    hardwareAllowance,
    baseBeforeMarkup,
    markupAmount,
    discountAmount,
    taxableAmount,
    taxAmount,
    sellTotal,
    cabinetLines,
    estimateLines,
    hardwareRollup: rollupHardware(projectCost.cabinets),
    summaryCards,
  };
}

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
  };
}

export function csvFromProjectQuote(quote: ProjectQuote): string {
  const rows = [
    ["Kind", "Label", "Amount", "Detail"],
    ...quote.estimateLines.map((line) => [
      line.kind,
      line.label,
      String(line.amount),
      line.detail ?? "",
    ]),
    ["total", "Quote total", String(quote.sellTotal), `Rev ${quote.job.revision}`],
  ];
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}
