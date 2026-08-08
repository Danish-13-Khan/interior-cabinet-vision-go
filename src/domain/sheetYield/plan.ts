import type { ProductionCutlistLine } from "../productionCutlist";
import {
  clampSheetOptimizerSettings,
  getSheetStockDefinition,
  sheetUsableSizeMm,
  type SheetOptimizerSettings,
} from "../sheetStock";
import { expandCutlistToParts } from "./expand";
import { packGroup } from "./packing";
import type { CutPartInstance, MaterialYieldGroup, ProjectSheetYield } from "./types";

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
