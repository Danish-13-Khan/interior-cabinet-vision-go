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

/** Saved quantity edits move the issued total by the same sell-share change. */
export function applyBoqDeltaToQuote(quote: ProjectQuote, delta: number): ProjectQuote {
  if (delta === 0) return quote;
  const sellTotal = quote.sellTotal + delta;
  return {
    ...quote,
    sellTotal,
    estimateLines: [
      ...quote.estimateLines.filter((line) => line.id !== "boq-quantity"),
      { id: "boq-quantity", kind: "note", label: "BOQ quantity adjustment", amount: delta },
    ],
    summaryCards: quote.summaryCards.map((card) =>
      card.label === "Quote total" ? { ...card, amount: sellTotal } : card,
    ),
  };
}

export function clampBoqQuantities(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw).slice(0, 200)) {
    const quantity = Math.round(Number(value));
    if (!key.trim() || key.length > 80 || !Number.isFinite(quantity) || quantity < 0 || quantity > 9999) continue;
    next[key] = quantity;
  }
  return next;
}
