import type { EstimateUnit } from "../interiorEstimate/state";

/** Customer-editable interior rates that are not millwork FinishId values. */
export type InteriorRate = {
  id: string;
  label: string;
  category: string;
  unit: EstimateUnit;
  costPerUnit: number;
};

/**
 * Seeded at zero so a shop must enter a rate before a line resolves.
 * A zero rate is treated as unset, not as an intentional free item.
 */
export const DEFAULT_INTERIOR_RATES: readonly InteriorRate[] = [
  { id: "acrylic", label: "Acrylic finish", category: "finish.acrylic", unit: "m2", costPerUnit: 0 },
  { id: "wallpaper", label: "Wallpaper", category: "surface.wall.wallpaper", unit: "m2", costPerUnit: 0 },
  { id: "tile", label: "Tile", category: "surface.tile", unit: "m2", costPerUnit: 0 },
  { id: "paint", label: "Wall / ceiling paint", category: "surface.wall", unit: "m2", costPerUnit: 0 },
  { id: "flooring", label: "Flooring", category: "surface.floor", unit: "m2", costPerUnit: 0 },
  { id: "led-driver", label: "LED driver", category: "light.driver", unit: "each", costPerUnit: 0 },
  { id: "led-profile", label: "LED profile", category: "light.profile", unit: "lm", costPerUnit: 0 },
  { id: "led-diffuser", label: "LED diffuser", category: "light.diffuser", unit: "lm", costPerUnit: 0 },
];

export function clampInteriorRate(row: Partial<InteriorRate> | undefined): InteriorRate | null {
  const seed = DEFAULT_INTERIOR_RATES.find((item) => item.id === row?.id);
  if (!seed) return null;
  const cost = Number(row?.costPerUnit);
  return { ...seed, costPerUnit: Number.isFinite(cost) && cost >= 0 ? cost : 0 };
}

export function clampInteriorRates(rows: readonly Partial<InteriorRate>[] | undefined): InteriorRate[] {
  const overlay = new Map(DEFAULT_INTERIOR_RATES.map((row) => [row.id, { ...row }]));
  for (const row of rows ?? []) {
    const clamped = clampInteriorRate(row);
    if (clamped) overlay.set(clamped.id, clamped);
  }
  return [...overlay.values()];
}

/** Positive book rates only — zero stays "needs a rate", not a free line. */
export function interiorRateLookup(rates: readonly InteriorRate[]): Record<string, number> {
  const lookup: Record<string, number> = {};
  for (const row of rates) {
    if (row.costPerUnit > 0) lookup[row.category] = row.costPerUnit;
  }
  return lookup;
}
