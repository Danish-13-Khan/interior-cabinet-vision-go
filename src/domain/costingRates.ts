import {
  BOARD_MATERIALS,
  EDGE_BANDING_OPTIONS,
  FINISHES,
  type BoardMaterialId,
  type EdgeBandingId,
  type FinishId,
} from "./materialSystem";
import type { HardwareLine } from "./hardwareSystem";

/** Optional shop-rate overlay. Empty / missing keys fall back to the catalog. */
export type CostRateOverrides = {
  boards?: Record<string, Record<number, number>>;
  finishes?: Record<string, number>;
  edges?: Record<string, number>;
  hardware?: Record<string, number>;
};

export function getBoardCost(
  materialId: BoardMaterialId,
  thicknessMm: number,
  rates?: CostRateOverrides,
): number {
  const overrideMap = rates?.boards?.[materialId];
  // Customer rates apply on an EXACT thickness match only. Backs default to 6 mm
  // and the catalog only carries 12/16/18/25, so matching the nearest key here
  // would quietly bill a 6 mm back at the shop's own 12 mm rate.
  if (overrideMap && Number.isFinite(overrideMap[thicknessMm])) {
    return overrideMap[thicknessMm];
  }
  const mat = BOARD_MATERIALS.find((item) => item.id === materialId);
  if (!mat) return 0;
  const keys = Object.keys(mat.costPerM2).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - thicknessMm) < Math.abs(prev - thicknessMm) ? curr : prev,
  );
  // Catalog fallback keeps pre-Phase-A behaviour for thicknesses with no row.
  return mat.costPerM2[closest] ?? 0;
}

export function getFinishCost(finishId: FinishId, rates?: CostRateOverrides): number {
  const override = rates?.finishes?.[finishId];
  if (override != null && Number.isFinite(override)) return override;
  return FINISHES.find((item) => item.id === finishId)?.costPerM2 ?? 0;
}

export function getEdgeBandCost(
  edgeBandId: EdgeBandingId,
  rates?: CostRateOverrides,
): number {
  const override = rates?.edges?.[edgeBandId];
  if (override != null && Number.isFinite(override)) return override;
  return EDGE_BANDING_OPTIONS.find((item) => item.id === edgeBandId)?.costPerM ?? 0;
}

export function applyHardwareRateOverrides(
  lines: HardwareLine[],
  rates?: CostRateOverrides,
): HardwareLine[] {
  if (!rates?.hardware) return lines;
  return lines.map((line) => {
    const unit = rates.hardware?.[line.id];
    if (unit == null || !Number.isFinite(unit)) return line;
    const unitCost = Math.max(0, unit);
    return { ...line, unitCost, totalCost: Math.round(unitCost * line.quantity) };
  });
}
