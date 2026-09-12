import type { ProjectReport } from "../projectReport";
import { boqBoardRole } from "./roles";
import type { BoqLine, BoqViews } from "./types";
import { buildBoqViews } from "./views";

function areaM2(lengthMm: number, widthMm: number, quantity: number) {
  return Number(((lengthMm * widthMm * quantity) / 1_000_000).toFixed(4));
}

/**
 * Build BOQ view lines from an existing project report (cutlist + quote cabinets).
 * Extends production cutlist grouping — does not invent a second quantity engine.
 */
export function buildBoqFromReport(report: ProjectReport): BoqViews {
  const sellByCabinet = new Map(
    report.quote.cabinetLines.map((line) => [line.cabinetId, line] as const),
  );
  const workshopByCabinet = new Map(
    report.projectCost.cabinets.map((cost) => [cost.cabinetId, cost.totalCost] as const),
  );
  const markByCabinet = new Map(
    report.cabinetSchedule.map((row) => [row.cabinetId, row.mark] as const),
  );

  const partCountByCabinet = new Map<string, number>();
  for (const line of report.productionCutlist) {
    partCountByCabinet.set(
      line.cabinetId,
      (partCountByCabinet.get(line.cabinetId) ?? 0) + line.quantity,
    );
  }

  const lines: BoqLine[] = report.productionCutlist.map((line) => {
    const parts = partCountByCabinet.get(line.cabinetId) ?? 1;
    const workshopTotal = workshopByCabinet.get(line.cabinetId) ?? 0;
    const sell = sellByCabinet.get(line.cabinetId);
    const share = parts > 0 ? line.quantity / parts : 0;
    return {
      key: line.key,
      cabinetId: line.cabinetId,
      cabinetName: line.cabinetName,
      mark: markByCabinet.get(line.cabinetId) ?? "",
      partLabel: line.label,
      category: String(line.category),
      role: boqBoardRole(line.category),
      material: line.material,
      finish: line.finish,
      thicknessMm: line.thicknessMm,
      quantity: line.quantity,
      lengthMm: line.lengthMm,
      widthMm: line.widthMm,
      areaM2: areaM2(line.lengthMm, line.widthMm, line.quantity),
      workshopCost: Math.round(workshopTotal * share),
      sellPrice: Math.round((sell?.sellPrice ?? 0) * share),
    };
  });

  return buildBoqViews(lines);
}
