import type { ProductionCutlistLine } from "./productionCutlist";
import {
  clampSheetOptimizerSettings,
  getSheetStockDefinition,
  sheetUsableSizeMm,
  type SheetOptimizerSettings,
  type SheetStockDefinition,
} from "./sheetStock";

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

const MIN_OFFCUT_MM = 80;

function canRotate(grain: string, allowRotateFreeGrain: boolean) {
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

type FreeRect = { x: number; y: number; w: number; h: number };

function fits(rect: FreeRect, w: number, h: number) {
  return w <= rect.w + 1e-6 && h <= rect.h + 1e-6;
}

function splitRect(rect: FreeRect, w: number, h: number, kerf: number): FreeRect[] {
  const next: FreeRect[] = [];
  const rightW = rect.w - w - kerf;
  if (rightW >= MIN_OFFCUT_MM) {
    next.push({ x: rect.x + w + kerf, y: rect.y, w: rightW, h: h });
  }
  const bottomH = rect.h - h - kerf;
  if (bottomH >= MIN_OFFCUT_MM) {
    next.push({ x: rect.x, y: rect.y + h + kerf, w: rect.w, h: bottomH });
  }
  return next;
}

function placePartsOnSheet(
  parts: CutPartInstance[],
  sheet: SheetStockDefinition,
  usable: { lengthMm: number; widthMm: number; areaM2: number },
  settings: SheetOptimizerSettings,
  material: string,
  thicknessMm: number,
  sheetIndex: number,
): PackedSheet {
  const free: FreeRect[] = [{ x: 0, y: 0, w: usable.lengthMm, h: usable.widthMm }];
  const placed: PlacedCutPart[] = [];

  const ordered = [...parts].sort(
    (a, b) => Math.max(b.lengthMm, b.widthMm) - Math.max(a.lengthMm, a.widthMm),
  );

  for (const part of ordered) {
    const orientations: Array<{ w: number; h: number; rotated: boolean }> = [
      { w: part.lengthMm, h: part.widthMm, rotated: false },
    ];
    if (canRotate(part.grain, settings.allowRotateFreeGrain) && part.lengthMm !== part.widthMm) {
      orientations.push({ w: part.widthMm, h: part.lengthMm, rotated: true });
    }

    let best: { rectIndex: number; orient: (typeof orientations)[number] } | null = null;
    for (let rectIndex = 0; rectIndex < free.length; rectIndex += 1) {
      const rect = free[rectIndex];
      for (const orient of orientations) {
        if (!fits(rect, orient.w, orient.h)) continue;
        if (
          !best ||
          rect.y < free[best.rectIndex].y ||
          (rect.y === free[best.rectIndex].y && rect.x < free[best.rectIndex].x)
        ) {
          best = { rectIndex, orient };
        }
      }
    }

    if (!best) {
      // Should not happen if caller only passes parts that fit a fresh sheet;
      // skip oversized parts silently by not placing them.
      continue;
    }

    const rect = free[best.rectIndex];
    free.splice(best.rectIndex, 1);
    free.push(...splitRect(rect, best.orient.w, best.orient.h, settings.kerfMm));
    free.sort((a, b) => a.y - b.y || a.x - b.x);

    placed.push({
      ...part,
      xMm: Math.round(rect.x),
      yMm: Math.round(rect.y),
      placedLengthMm: best.orient.w,
      placedWidthMm: best.orient.h,
      rotated: best.orient.rotated,
    });
  }

  const usedAreaM2 = Number(
    (
      placed.reduce((sum, part) => sum + part.placedLengthMm * part.placedWidthMm, 0) /
      1_000_000
    ).toFixed(4),
  );
  const wasteAreaM2 = Number(Math.max(0, usable.areaM2 - usedAreaM2).toFixed(4));
  const yieldPercent =
    usable.areaM2 > 0 ? Number(((usedAreaM2 / usable.areaM2) * 100).toFixed(1)) : 0;

  const offcuts: SheetOffcut[] = free
    .filter((rect) => rect.w >= MIN_OFFCUT_MM && rect.h >= MIN_OFFCUT_MM)
    .map((rect, index) => {
      const areaM2 = Number(((rect.w * rect.h) / 1_000_000).toFixed(4));
      const reclaimable = rect.w >= 200 && rect.h >= 200;
      return {
        id: `offcut-${sheetIndex}-${index + 1}`,
        xMm: Math.round(rect.x),
        yMm: Math.round(rect.y),
        lengthMm: Math.round(rect.w),
        widthMm: Math.round(rect.h),
        areaM2,
        reclaimable,
      };
    })
    .sort((a, b) => b.areaM2 - a.areaM2);

  return {
    sheetIndex,
    sheetId: sheet.id,
    label: `${sheet.label} · S${String(sheetIndex).padStart(2, "0")}`,
    material,
    thicknessMm,
    parts: placed,
    usedAreaM2,
    wasteAreaM2,
    yieldPercent,
    offcuts,
  };
}

function packGroup(
  parts: CutPartInstance[],
  sheet: SheetStockDefinition,
  settings: SheetOptimizerSettings,
): PackedSheet[] {
  const usable = sheetUsableSizeMm(sheet, settings.trimMm);
  const remaining = [...parts].sort(
    (a, b) => Math.max(b.lengthMm, b.widthMm) - Math.max(a.lengthMm, a.widthMm),
  );
  const sheets: PackedSheet[] = [];
  let guard = 0;

  while (remaining.length > 0 && guard < 500) {
    guard += 1;
    const batch: CutPartInstance[] = [];
    const deferred: CutPartInstance[] = [];

    // Greedy fill: try each remaining part on a virtual fresh free-rect set via trial place.
    // Simpler approach: take as many as fit by sequential packing into one sheet, leave rest.
    const candidate = [...remaining];
    const trialSheet = placePartsOnSheet(
      candidate,
      sheet,
      usable,
      settings,
      candidate[0]?.material ?? "Board",
      candidate[0]?.thicknessMm ?? 18,
      sheets.length + 1,
    );

    const placedIds = new Set(trialSheet.parts.map((part) => part.id));
    for (const part of remaining) {
      if (placedIds.has(part.id)) batch.push(part);
      else deferred.push(part);
    }

    // If nothing placed (oversized part), force-drop one to avoid infinite loop.
    if (batch.length === 0) {
      const oversized = remaining.shift();
      if (!oversized) break;
      // Create an "overflow" sheet entry with no placement geometry for visibility.
      sheets.push({
        sheetIndex: sheets.length + 1,
        sheetId: sheet.id,
        label: `${sheet.label} · OVERSIZE`,
        material: oversized.material,
        thicknessMm: oversized.thicknessMm,
        parts: [
          {
            ...oversized,
            xMm: 0,
            yMm: 0,
            placedLengthMm: oversized.lengthMm,
            placedWidthMm: oversized.widthMm,
            rotated: false,
          },
        ],
        usedAreaM2: Number(
          ((oversized.lengthMm * oversized.widthMm) / 1_000_000).toFixed(4),
        ),
        wasteAreaM2: 0,
        yieldPercent: 0,
        offcuts: [],
      });
      continue;
    }

    sheets.push({
      ...trialSheet,
      sheetIndex: sheets.length + 1,
      label: `${sheet.label} · S${String(sheets.length + 1).padStart(2, "0")}`,
    });
    remaining.length = 0;
    remaining.push(...deferred);
  }

  return sheets;
}

export function planSheetYield(
  lines: ProductionCutlistLine[],
  optimizerSettings?: Partial<SheetOptimizerSettings>,
): ProjectSheetYield {
  const settings = clampSheetOptimizerSettings(optimizerSettings);
  const sheet = getSheetStockDefinition(settings.sheetId);
  const usable = sheetUsableSizeMm(sheet, settings.trimMm);
  const parts = expandCutlistToParts(lines);

  const byMaterial = new Map<string, CutPartInstance[]>();
  for (const part of parts) {
    const key = `${part.material}|${part.thicknessMm}`;
    const group = byMaterial.get(key) ?? [];
    group.push(part);
    byMaterial.set(key, group);
  }

  const lineCountByKey = new Map<string, number>();
  for (const line of lines) {
    const key = `${line.material}|${line.thicknessMm}`;
    lineCountByKey.set(key, (lineCountByKey.get(key) ?? 0) + 1);
  }

  const groups: MaterialYieldGroup[] = Array.from(byMaterial.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, groupParts]) => {
      const material = groupParts[0].material;
      const thicknessMm = groupParts[0].thicknessMm;
      const sheets = packGroup(groupParts, sheet, settings);
      const partAreaM2 = Number(
        (
          groupParts.reduce((sum, part) => sum + part.lengthMm * part.widthMm, 0) /
          1_000_000
        ).toFixed(4),
      );
      const usedAreaM2 = Number(
        sheets.reduce((sum, packed) => sum + packed.usedAreaM2, 0).toFixed(4),
      );
      const sheetArea = usable.areaM2 * sheets.length;
      const wasteAreaM2 = Number(Math.max(0, sheetArea - usedAreaM2).toFixed(4));
      const offcutAreaM2 = Number(
        sheets
          .reduce(
            (sum, packed) =>
              sum + packed.offcuts.reduce((inner, offcut) => inner + offcut.areaM2, 0),
            0,
          )
          .toFixed(4),
      );
      const reclaimableOffcutAreaM2 = Number(
        sheets
          .reduce(
            (sum, packed) =>
              sum +
              packed.offcuts
                .filter((offcut) => offcut.reclaimable)
                .reduce((inner, offcut) => inner + offcut.areaM2, 0),
            0,
          )
          .toFixed(4),
      );
      const yieldPercent =
        sheetArea > 0 ? Number(((usedAreaM2 / sheetArea) * 100).toFixed(1)) : 0;

      return {
        key,
        material,
        thicknessMm,
        partCount: groupParts.length,
        cutLineCount: lineCountByKey.get(key) ?? 0,
        partAreaM2,
        sheetsUsed: sheets.length,
        usedAreaM2,
        wasteAreaM2,
        yieldPercent,
        offcutAreaM2,
        reclaimableOffcutAreaM2,
        sheets,
      };
    });

  const totalSheets = groups.reduce((sum, group) => sum + group.sheetsUsed, 0);
  const totalPartAreaM2 = Number(
    groups.reduce((sum, group) => sum + group.partAreaM2, 0).toFixed(4),
  );
  const totalUsedAreaM2 = Number(
    groups.reduce((sum, group) => sum + group.usedAreaM2, 0).toFixed(4),
  );
  const totalWasteAreaM2 = Number(
    groups.reduce((sum, group) => sum + group.wasteAreaM2, 0).toFixed(4),
  );
  const totalOffcutAreaM2 = Number(
    groups.reduce((sum, group) => sum + group.offcutAreaM2, 0).toFixed(4),
  );
  const reclaimableOffcutAreaM2 = Number(
    groups.reduce((sum, group) => sum + group.reclaimableOffcutAreaM2, 0).toFixed(4),
  );
  const totalSheetArea = usable.areaM2 * totalSheets;
  const overallYieldPercent =
    totalSheetArea > 0
      ? Number(((totalUsedAreaM2 / totalSheetArea) * 100).toFixed(1))
      : 0;

  return {
    settings,
    sheet,
    usableLengthMm: usable.lengthMm,
    usableWidthMm: usable.widthMm,
    groups,
    totalSheets,
    totalPartAreaM2,
    totalUsedAreaM2,
    totalWasteAreaM2,
    overallYieldPercent,
    totalOffcutAreaM2,
    reclaimableOffcutAreaM2,
  };
}

export function csvFromSheetYield(plan: ProjectSheetYield): string {
  const rows = [
    ["Material", "Thickness", "Sheet", "Shop Ref", "Part", "Cabinet", "X", "Y", "L", "W", "Rotated"],
  ];
  for (const group of plan.groups) {
    for (const sheet of group.sheets) {
      for (const part of sheet.parts) {
        rows.push([
          group.material,
          String(group.thicknessMm),
          sheet.label,
          part.shopRef,
          part.label,
          part.cabinetName,
          String(part.xMm),
          String(part.yMm),
          String(part.placedLengthMm),
          String(part.placedWidthMm),
          part.rotated ? "yes" : "no",
        ]);
      }
    }
  }
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}
