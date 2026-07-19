import type { CabinetProject } from "./cabinetDimensions";
import type { CabinetCutlistItem } from "./cabinetGeometry";
import { createCabinetCutlist } from "./cabinetGeometry";

export function generatePerCabinetCutlists(project: CabinetProject): {
  cabinetId: string; cabinetName: string; items: CabinetCutlistItem[];
}[] {
  return project.cabinets.map(function(cab) { return {
    cabinetId: cab.id,
    cabinetName: cab.name,
    items: createCabinetCutlist(cab.config),
  }; });
}

export type MaterialSummaryRow = {
  material: string;
  thicknessMm: number;
  totalAreaM2: number;
  estimatedBoards: number;
};

export function computeMaterialSummary(items: CabinetCutlistItem[]): MaterialSummaryRow[] {
  var map = new Map<string, MaterialSummaryRow>();
  for (var _i = 0; _i < items.length; _i++) {
    var p = items[_i];
    var key = p.material + "-" + p.thicknessMm;
    var existing = map.get(key);
    var area = (p.lengthMm * p.widthMm * p.quantity) / 1e6;
    if (existing) {
      existing.totalAreaM2 += area;
      existing.estimatedBoards = Math.ceil(existing.totalAreaM2 / (2.44 * 1.22));
    } else {
      map.set(key, {
        material: p.material,
        thicknessMm: p.thicknessMm,
        totalAreaM2: area,
        estimatedBoards: Math.ceil(area / (2.44 * 1.22)),
      });
    }
  }
  return Array.from(map.values()).sort(function(a, b) { return b.totalAreaM2 - a.totalAreaM2; });
}

export function csvFromCutlist(items: CabinetCutlistItem[]): string {
  var h = ["Part", "Material", "Thickness mm", "Qty", "Length mm", "Width mm"];
  var rows = items.map(function(p) { return [
    p.label, p.material, String(p.thicknessMm), String(p.quantity),
    String(p.lengthMm), String(p.widthMm),
  ]; });
  var all = [h].concat(rows);
  return all.map(function(r) { return r.map(function(v) { return '"' + v.replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
}
