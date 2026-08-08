import type { ProductionCutlistLine } from "../productionCutlist";
import type { CutPartInstance } from "./types";

export const MIN_OFFCUT_MM = 80;

export function canRotate(grain: string, allowRotateFreeGrain: boolean) {
  if (!allowRotateFreeGrain) return false;
  const normalized = grain.trim().toLowerCase();
  return normalized === "" || normalized === "none" || normalized === "free";
}

export function expandCutlistToParts(lines: ProductionCutlistLine[]): CutPartInstance[] {
  const parts: CutPartInstance[] = [];
  for (const line of lines) {
    const qty = Math.max(1, Math.round(line.quantity));
    for (let index = 0; index < qty; index += 1) {
      parts.push({
        id: `${line.key}#${index + 1}`,
        shopRef: line.shopRef,
        label: line.label,
        cabinetName: line.cabinetName,
        material: line.material,
        thicknessMm: line.thicknessMm,
        lengthMm: Math.max(1, Math.round(line.lengthMm)),
        widthMm: Math.max(1, Math.round(line.widthMm)),
        grain: line.grain,
        sourceKey: line.key,
      });
    }
  }
  return parts;
}
