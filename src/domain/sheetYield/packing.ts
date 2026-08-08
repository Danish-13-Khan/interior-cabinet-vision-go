import {
  type SheetOptimizerSettings,
  type SheetStockDefinition,
  sheetUsableSizeMm,
} from "../sheetStock";
import { MIN_OFFCUT_MM, canRotate } from "./expand";
import type { CutPartInstance, PackedSheet, PlacedCutPart, SheetOffcut } from "./types";

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

export function placePartsOnSheet(
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

export function packGroup(
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
