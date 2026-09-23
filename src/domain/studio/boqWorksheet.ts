import type { BoqLine } from "../boq";
import type { ProjectQuote } from "../projectQuote";

/** Scale one BOQ line when a worksheet quantity changes. Prices stay proportional to the report. */
export function scaleBoqLine(line: BoqLine, quantity: number): BoqLine {
  const next = Math.max(0, Math.round(quantity));
  const factor = line.quantity > 0 ? next / line.quantity : 0;
  return {
    ...line,
    quantity: next,
    areaM2: Number((line.areaM2 * factor).toFixed(4)),
    workshopCost: Math.round(line.workshopCost * factor),
    sellPrice: Math.round(line.sellPrice * factor),
  };
}

export function applyBoqQuantities(lines: readonly BoqLine[], quantities: Readonly<Record<string, number>>) {
  return lines.map((line) => (quantities[line.key] === undefined ? line : scaleBoqLine(line, quantities[line.key]!)));
}

export function boqWorksheetTotals(lines: readonly BoqLine[]) {
  return lines.reduce(
    (totals, line) => ({
      quantity: totals.quantity + line.quantity,
      workshop: totals.workshop + line.workshopCost,
      sell: totals.sell + line.sellPrice,
    }),
    { quantity: 0, workshop: 0, sell: 0 },
  );
}

export function boqSellDelta(lines: readonly BoqLine[], quantities: Readonly<Record<string, number>>) {
  const edited = applyBoqQuantities(lines, quantities);
  const before = lines.reduce((sum, line) => sum + line.sellPrice, 0);
  const after = edited.reduce((sum, line) => sum + line.sellPrice, 0);
  return { lines: edited, delta: after - before };
}

export function boqWorkshopDelta(lines: readonly BoqLine[], quantities: Readonly<Record<string, number>>) {
  const edited = applyBoqQuantities(lines, quantities);
  const before = lines.reduce((sum, line) => sum + line.workshopCost, 0);
  const after = edited.reduce((sum, line) => sum + line.workshopCost, 0);
  return { lines: edited, delta: after - before };
}

function roundMoney(value: number) {
  return Math.round(value);
}

/** Quantity edits change workshop cost, then markup, discount, and tax run again. */
export function applyBoqDeltaToQuote(quote: ProjectQuote, workshopDelta: number): ProjectQuote {
  if (workshopDelta === 0) return quote;
  const { settings } = quote;
  const baseBeforeMarkup = roundMoney(quote.baseBeforeMarkup + workshopDelta);
  const markupAmount = roundMoney(baseBeforeMarkup * (settings.markupPercent / 100));
  const afterMarkup = baseBeforeMarkup + markupAmount;
  const discountAmount = roundMoney(afterMarkup * (settings.discountPercent / 100));
  const taxableAmount = roundMoney(afterMarkup - discountAmount);
  const taxAmount = roundMoney(taxableAmount * (settings.taxPercent / 100));
  const sellTotal = roundMoney(taxableAmount + taxAmount);
  const cards: Record<string, number> = {
    "Workshop cost": quote.workshopSubtotal + workshopDelta,
    Markup: markupAmount,
    Discount: discountAmount,
    Tax: taxAmount,
    "Quote total": sellTotal,
  };
  const costs = quote.estimateLines.filter((line) =>
    line.kind !== "markup" && line.kind !== "discount" && line.kind !== "tax" && line.id !== "boq-quantity",
  );
  return {
    ...quote,
    workshopSubtotal: cards["Workshop cost"]!,
    baseBeforeMarkup,
    markupAmount,
    discountAmount,
    taxableAmount,
    taxAmount,
    sellTotal,
    estimateLines: [
      ...costs,
      { id: "boq-quantity", kind: "note", label: "BOQ quantity adjustment", amount: workshopDelta },
      ...(markupAmount > 0 ? [{ id: "markup", kind: "markup" as const, label: `Markup (${settings.markupPercent}%)`, amount: markupAmount }] : []),
      ...(discountAmount > 0 ? [{ id: "discount", kind: "discount" as const, label: `Discount (${settings.discountPercent}%)`, amount: -discountAmount }] : []),
      ...(taxAmount > 0 ? [{ id: "tax", kind: "tax" as const, label: `Tax (${settings.taxPercent}%)`, amount: taxAmount }] : []),
    ],
    summaryCards: quote.summaryCards.map((card) =>
      card.label in cards ? { ...card, amount: cards[card.label]! } : card,
    ),
  };
}

const BOQ_QUANTITY_CAP = 200;

function validBoqEntries(raw: unknown): Array<[string, number]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const entries: Array<[string, number]> = [];
  for (const [key, value] of Object.entries(raw)) {
    const quantity = Math.round(Number(value));
    if (!key.trim() || key.length > 80 || !Number.isFinite(quantity) || quantity < 0 || quantity > 9999) continue;
    entries.push([key, quantity]);
  }
  return entries;
}

export function clampBoqQuantities(raw: unknown): Record<string, number> {
  return Object.fromEntries(validBoqEntries(raw).slice(0, BOQ_QUANTITY_CAP));
}

export function boqQuantityLimitMessage(raw: unknown): string | null {
  const omitted = validBoqEntries(raw).length - BOQ_QUANTITY_CAP;
  if (omitted <= 0) return null;
  return `Only 200 quantity edits are saved. ${omitted} more ${omitted === 1 ? "was" : "were"} not kept.`;
}
