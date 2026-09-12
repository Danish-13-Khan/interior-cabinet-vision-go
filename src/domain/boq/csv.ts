import type { BoqViews } from "./types";
import { boqBoardRoleLabel } from "./roles";

function csvEscape(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function csvFromBoqViews(views: BoqViews): string {
  const header = [
    "Mark",
    "Cabinet",
    "Part",
    "Role",
    "Category",
    "Material",
    "Finish",
    "Thickness mm",
    "Qty",
    "Length mm",
    "Width mm",
    "Area m2",
    "Workshop",
    "Sell",
  ];
  const rows = views.lines.map((line) => [
    line.mark,
    line.cabinetName,
    line.partLabel,
    boqBoardRoleLabel(line.role),
    line.category,
    line.material,
    line.finish,
    line.thicknessMm,
    line.quantity,
    line.lengthMm,
    line.widthMm,
    line.areaM2,
    line.workshopCost,
    line.sellPrice,
  ]);
  return [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}
