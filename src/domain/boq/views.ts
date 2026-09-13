import type { BoqGroup, BoqLine, BoqViews } from "./types";
import { boqBoardRoleLabel } from "./roles";

function lineAreaM2(line: BoqLine) {
  return line.areaM2;
}

function groupLines(
  lines: BoqLine[],
  getKey: (line: BoqLine) => string,
  getTitle: (key: string, sample: BoqLine) => string,
): BoqGroup[] {
  const map = new Map<string, BoqLine[]>();
  for (const line of lines) {
    const key = getKey(line);
    const bucket = map.get(key) ?? [];
    bucket.push(line);
    map.set(key, bucket);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, group]) => {
      const sorted = [...group].sort(
        (left, right) =>
          left.cabinetName.localeCompare(right.cabinetName) ||
          left.partLabel.localeCompare(right.partLabel),
      );
      return {
        key,
        title: getTitle(key, sorted[0]),
        lines: sorted,
        totalQuantity: sorted.reduce((sum, line) => sum + line.quantity, 0),
        totalAreaM2: Number(sorted.reduce((sum, line) => sum + lineAreaM2(line), 0).toFixed(3)),
        workshopCost: sorted.reduce((sum, line) => sum + line.workshopCost, 0),
        sellPrice: sorted.reduce((sum, line) => sum + line.sellPrice, 0),
      };
    });
}

export function buildBoqViews(lines: BoqLine[]): BoqViews {
  return {
    lines,
    byCabinet: groupLines(
      lines,
      (line) => line.cabinetId,
      (_key, sample) => `${sample.mark} · ${sample.cabinetName}`,
    ),
    byMaterial: groupLines(
      lines,
      (line) => `${line.material}|${line.thicknessMm}`,
      (_key, sample) => `${sample.material} · ${sample.thicknessMm} mm`,
    ),
    byThickness: groupLines(
      lines,
      (line) => String(line.thicknessMm),
      (key) => `${key} mm`,
    ),
    byRole: groupLines(
      lines,
      (line) => line.role,
      (key) => boqBoardRoleLabel(key as BoqLine["role"]),
    ),
  };
}
