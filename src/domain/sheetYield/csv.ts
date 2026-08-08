import type { ProjectSheetYield } from "./types";

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
