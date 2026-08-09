import type { CabinetInstance, CabinetProject } from "./cabinetDimensions";
import {
  createCabinetConstruction,
  getConstructionFlatParts,
  type PartCategory,
} from "./cabinetConstruction";
import { formatPartShopRef } from "./shopTerms";

export type ProductionCutlistLine = {
  key: string;
  partId: string;
  shopRef: string;
  label: string;
  quantity: number;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  material: string;
  finish: string;
  edgeBanding: string;
  grain: string;
  category: PartCategory | string;
  cabinetId: string;
  cabinetName: string;
  cabinetIndex: number;
  notes?: string;
};

export type ProductionCutlistGroup = {
  key: string;
  title: string;
  lines: ProductionCutlistLine[];
  totalQuantity: number;
  totalAreaM2: number;
};

export type MaterialBoardEstimate = {
  material: string;
  thicknessMm: number;
  totalAreaM2: number;
  estimatedBoards: number;
  lineCount: number;
};

function lineAreaM2(line: ProductionCutlistLine) {
  return (line.lengthMm * line.widthMm * line.quantity) / 1_000_000;
}

function formatShopRef(cabinetIndex: number, partIndex: number) {
  return formatPartShopRef(cabinetIndex, partIndex);
}

export function createCabinetProductionCutlist(
  cabinet: CabinetInstance,
  cabinetIndex = 1,
): ProductionCutlistLine[] {
  const construction = createCabinetConstruction(cabinet.config);
  return getConstructionFlatParts(construction).map((part, partIndex) => ({
    key: `${cabinet.id}:${part.key}`,
    partId: part.key,
    shopRef: formatShopRef(cabinetIndex, partIndex + 1),
    label: part.label,
    quantity: part.qty,
    lengthMm: part.lengthMm,
    widthMm: part.widthMm,
    thicknessMm: part.thicknessMm,
    material: part.material,
    finish: part.finish,
    edgeBanding: part.edgeBanding,
    grain: part.grain,
    category: part.category,
    cabinetId: cabinet.id,
    cabinetName: cabinet.name,
    cabinetIndex,
    notes: part.notes,
  }));
}

export function createProjectProductionCutlist(
  project: CabinetProject,
): ProductionCutlistLine[] {
  return project.cabinets.flatMap((cabinet, index) =>
    createCabinetProductionCutlist(cabinet, index + 1),
  );
}

function groupLines(
  lines: ProductionCutlistLine[],
  getKey: (line: ProductionCutlistLine) => string,
  getTitle: (key: string, sample: ProductionCutlistLine) => string,
): ProductionCutlistGroup[] {
  const map = new Map<string, ProductionCutlistLine[]>();

  for (const line of lines) {
    const key = getKey(line);
    const group = map.get(key) ?? [];
    group.push(line);
    map.set(key, group);
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, groupLines]) => {
      const sorted = [...groupLines].sort(
        (left, right) =>
          left.cabinetName.localeCompare(right.cabinetName) ||
          left.label.localeCompare(right.label),
      );
      return {
        key,
        title: getTitle(key, sorted[0]),
        lines: sorted,
        totalQuantity: sorted.reduce((sum, line) => sum + line.quantity, 0),
        totalAreaM2: Number(
          sorted.reduce((sum, line) => sum + lineAreaM2(line), 0).toFixed(3),
        ),
      };
    });
}

export function groupCutlistByMaterial(
  lines: ProductionCutlistLine[],
): ProductionCutlistGroup[] {
  return groupLines(
    lines,
    (line) => `${line.material}|${line.thicknessMm}`,
    (_key, sample) => `${sample.material} · ${sample.thicknessMm} mm`,
  );
}

export function groupCutlistByThickness(
  lines: ProductionCutlistLine[],
): ProductionCutlistGroup[] {
  return groupLines(
    lines,
    (line) => String(line.thicknessMm),
    (key) => `${key} mm`,
  );
}

export function groupCutlistByCabinet(
  lines: ProductionCutlistLine[],
): ProductionCutlistGroup[] {
  return groupLines(
    lines,
    (line) => line.cabinetId,
    (_key, sample) => sample.cabinetName,
  );
}

export function computeProductionMaterialSummary(
  lines: ProductionCutlistLine[],
): MaterialBoardEstimate[] {
  const map = new Map<string, MaterialBoardEstimate>();

  for (const line of lines) {
    const key = `${line.material}|${line.thicknessMm}`;
    const area = lineAreaM2(line);
    const existing = map.get(key);
    if (existing) {
      existing.totalAreaM2 += area;
      existing.lineCount += 1;
      existing.estimatedBoards = Math.ceil(existing.totalAreaM2 / (2.44 * 1.22));
    } else {
      map.set(key, {
        material: line.material,
        thicknessMm: line.thicknessMm,
        totalAreaM2: area,
        estimatedBoards: Math.ceil(area / (2.44 * 1.22)),
        lineCount: 1,
      });
    }
  }

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      totalAreaM2: Number(row.totalAreaM2.toFixed(3)),
    }))
    .sort((a, b) => b.totalAreaM2 - a.totalAreaM2);
}

export function csvFromProductionCutlist(lines: ProductionCutlistLine[]): string {
  const header = [
    "Shop Ref",
    "Cabinet",
    "Part",
    "Category",
    "Material",
    "Finish",
    "Edge",
    "Thickness mm",
    "Qty",
    "Length mm",
    "Width mm",
    "Grain",
    "Notes",
  ];
  const rows = lines.map((line) => [
    line.shopRef,
    line.cabinetName,
    line.label,
    String(line.category),
    line.material,
    line.finish,
    line.edgeBanding,
    String(line.thicknessMm),
    String(line.quantity),
    String(line.lengthMm),
    String(line.widthMm),
    line.grain,
    line.notes ?? "",
  ]);

  return [header, ...rows]
    .map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}
