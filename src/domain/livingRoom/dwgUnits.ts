/** Common architectural INSUNITS values. Unknown units require calibration.
 * Source: Autodesk AutoCAD INSUNITS system variable reference.
 * Header units are an initial scale hint, never proof of measured accuracy.
 */
const MM_PER_UNIT: Readonly<Record<number, number>> = {
  1: 25.4, 2: 304.8, 3: 1609344, 4: 1, 5: 10, 6: 1000,
  7: 1000000, 8: 0.0000254, 9: 0.0254, 10: 914.4,
  11: 1e-7, 12: 1e-6, 13: 0.001, 14: 100, 15: 10000,
  16: 100000, 17: 1e12,
  21: 1200000 / 3937, 22: 100000 / 3937,
  23: 3600000 / 3937, 24: 6336000000 / 3937,
};

export function dwgMillimetersPerUnit(insunits: unknown): number | null {
  if (typeof insunits !== "number" || !Number.isInteger(insunits)) return null;
  return MM_PER_UNIT[insunits] ?? null;
}

export type DwgPlanBounds = { minX: number; minY: number; maxX: number; maxY: number };

/** Preserve aspect and scale; do not silently fit unknown units to room width. */
export function dwgPlanDimensionsMm(bounds: DwgPlanBounds, mmPerUnit: number) {
  const { minX, minY, maxX, maxY } = bounds;
  if (![minX, minY, maxX, maxY, mmPerUnit].every(Number.isFinite)
    || mmPerUnit <= 0 || maxX <= minX || maxY <= minY) {
    throw new Error("DWG preview requires finite, non-empty bounds and a positive scale.");
  }
  const widthMm = (maxX - minX) * mmPerUnit;
  const heightMm = (maxY - minY) * mmPerUnit;
  if (![widthMm, heightMm].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error("DWG dimensions are outside the supported numeric range.");
  }
  return { widthMm, heightMm };
}
