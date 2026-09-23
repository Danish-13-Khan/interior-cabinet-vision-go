import type { BoqLine } from "../boq";

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
