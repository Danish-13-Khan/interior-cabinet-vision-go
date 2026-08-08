import type {
  SheetOptimizerSettings,
  SheetStockDefinition,
} from "../sheetStock";

export type CutPartInstance = {
  id: string;
  shopRef: string;
  label: string;
  cabinetName: string;
  material: string;
  thicknessMm: number;
  lengthMm: number;
  widthMm: number;
  grain: string;
  sourceKey: string;
};

export type PlacedCutPart = CutPartInstance & {
  xMm: number;
  yMm: number;
  placedLengthMm: number;
  placedWidthMm: number;
  rotated: boolean;
};

export type SheetOffcut = {
  id: string;
  xMm: number;
  yMm: number;
  lengthMm: number;
  widthMm: number;
  areaM2: number;
  reclaimable: boolean;
};

export type PackedSheet = {
  sheetIndex: number;
  sheetId: string;
  label: string;
  material: string;
  thicknessMm: number;
  parts: PlacedCutPart[];
  usedAreaM2: number;
  wasteAreaM2: number;
  yieldPercent: number;
  offcuts: SheetOffcut[];
};

export type MaterialYieldGroup = {
  key: string;
  material: string;
  thicknessMm: number;
  partCount: number;
  cutLineCount: number;
  partAreaM2: number;
  sheetsUsed: number;
  usedAreaM2: number;
  wasteAreaM2: number;
  yieldPercent: number;
  offcutAreaM2: number;
  reclaimableOffcutAreaM2: number;
  sheets: PackedSheet[];
};

export type ProjectSheetYield = {
  settings: SheetOptimizerSettings;
  sheet: SheetStockDefinition;
  usableLengthMm: number;
  usableWidthMm: number;
  groups: MaterialYieldGroup[];
  totalSheets: number;
  totalPartAreaM2: number;
  totalUsedAreaM2: number;
  totalWasteAreaM2: number;
  overallYieldPercent: number;
  totalOffcutAreaM2: number;
  reclaimableOffcutAreaM2: number;
};
