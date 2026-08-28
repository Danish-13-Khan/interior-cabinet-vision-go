import { formatMaterialIds, formatMaterialLabels } from "./formatMaterials";
import type { MillworkSchedule } from "./types";

function csvCell(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

const HEADER = [
  "objectId",
  "name",
  "category",
  "kind",
  "roomId",
  "widthMm",
  "heightMm",
  "depthMm",
  "sku",
  "materialIds",
  "materialNames",
  "quantity",
] as const;

/** Spreadsheet takeoff — same millimetres as Plan/Model. */
export function millworkScheduleToCsv(schedule: MillworkSchedule) {
  const rows = schedule.lines.map((line) => [
    line.objectId,
    line.name,
    line.category,
    line.kind,
    line.roomId,
    line.widthMm,
    line.heightMm,
    line.depthMm,
    line.sku ?? "",
    formatMaterialIds(line.materialSlots),
    formatMaterialLabels(line.materialLabels),
    line.quantity,
  ].map(csvCell).join(","));
  return [HEADER.join(","), ...rows].join("\n");
}
