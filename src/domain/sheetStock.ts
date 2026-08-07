export type SheetStockDefinition = {
  id: string;
  label: string;
  lengthMm: number;
  widthMm: number;
  /** Optional material hint; empty means any board label. */
  materialHint: string;
};

export type SheetOptimizerSettings = {
  sheetId: string;
  kerfMm: number;
  trimMm: number;
  allowRotateFreeGrain: boolean;
};

export const DEFAULT_SHEET_STOCK: SheetStockDefinition[] = [
  {
    id: "sheet-2440x1220",
    label: "Full sheet 2440 × 1220",
    lengthMm: 2440,
    widthMm: 1220,
    materialHint: "",
  },
  {
    id: "sheet-2100x900",
    label: "Compact sheet 2100 × 900",
    lengthMm: 2100,
    widthMm: 900,
    materialHint: "",
  },
  {
    id: "sheet-1220x1220",
    label: "Square sheet 1220 × 1220",
    lengthMm: 1220,
    widthMm: 1220,
    materialHint: "",
  },
];

export const DEFAULT_SHEET_OPTIMIZER: SheetOptimizerSettings = {
  sheetId: "sheet-2440x1220",
  kerfMm: 3,
  trimMm: 10,
  allowRotateFreeGrain: true,
};

export function getSheetStockDefinition(id: string): SheetStockDefinition {
  return (
    DEFAULT_SHEET_STOCK.find((sheet) => sheet.id === id) ?? DEFAULT_SHEET_STOCK[0]
  );
}

export function clampSheetOptimizerSettings(
  settings: Partial<SheetOptimizerSettings> | undefined,
): SheetOptimizerSettings {
  const seed = {
    ...DEFAULT_SHEET_OPTIMIZER,
    ...(settings ?? {}),
  };
  const sheet = getSheetStockDefinition(seed.sheetId);

  return {
    sheetId: sheet.id,
    kerfMm: Math.min(12, Math.max(0, Math.round(Number(seed.kerfMm) || 0))),
    trimMm: Math.min(40, Math.max(0, Math.round(Number(seed.trimMm) || 0))),
    allowRotateFreeGrain: seed.allowRotateFreeGrain !== false,
  };
}

export function sheetUsableSizeMm(
  sheet: SheetStockDefinition,
  trimMm: number,
): { lengthMm: number; widthMm: number; areaM2: number } {
  const lengthMm = Math.max(100, sheet.lengthMm - trimMm * 2);
  const widthMm = Math.max(100, sheet.widthMm - trimMm * 2);
  return {
    lengthMm,
    widthMm,
    areaM2: Number(((lengthMm * widthMm) / 1_000_000).toFixed(4)),
  };
}
