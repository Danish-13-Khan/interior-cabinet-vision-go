import type { InteriorObjectEntity } from "../interiorProject";
import type { EstimateUnit } from "./state";
import type { InteriorEstimateLine } from "./measure";

/** Rate category for a placed object. Catalogue category first so a customer rate covers a whole group. */
export function objectRateCategory(object: InteriorObjectEntity): string {
  const group = object.category.trim().toLowerCase().replace(/\s+/g, "-");
  return `object.${group || object.kind}`;
}

const FIXED_LABELS: Record<string, string> = {
  "surface.floor": "Floor finish",
  "surface.ceiling": "Ceiling finish",
  "surface.wall": "Wall finish",
  "light.strip": "LED strip",
  "light.fixture": "Light fixture",
  "light.driver": "LED driver",
  "light.profile": "LED profile",
  "light.diffuser": "LED diffuser",
  "surface.wall.wallpaper": "Wallpaper",
  "surface.wall.tile": "Wall tile",
  "surface.tile": "Floor tile",
  "finish.acrylic": "Acrylic finish",
  manual: "Custom items",
};

export function rateCategoryLabel(category: string): string {
  if (FIXED_LABELS[category]) return FIXED_LABELS[category];
  const group = category.replace(/^object\./, "").replace(/-/g, " ");
  return group.charAt(0).toUpperCase() + group.slice(1);
}

export type RateCategorySummary = {
  category: string;
  label: string;
  unit: EstimateUnit;
  lineCount: number;
  rate: number | null;
  /** True when at least one line still resolves no rate from any source. */
  needsRate: boolean;
};

/**
 * Categories actually present in the measured lines, so the rate editor only asks
 * for rates the project needs. Manual lines carry their own rate and are excluded.
 */
export function collectRateCategories(lines: readonly InteriorEstimateLine[]): RateCategorySummary[] {
  const byCategory = new Map<string, RateCategorySummary>();
  for (const line of lines) {
    if (line.category === "manual") continue;
    const existing = byCategory.get(line.category);
    if (existing) {
      existing.lineCount += 1;
      existing.needsRate = existing.needsRate || line.rateSource === "missing";
      continue;
    }
    byCategory.set(line.category, {
      category: line.category,
      label: rateCategoryLabel(line.category),
      unit: line.unit,
      lineCount: 1,
      rate: line.rateSource === "category" ? line.rate : null,
      needsRate: line.rateSource === "missing",
    });
  }
  return [...byCategory.values()].sort((a, b) => a.label.localeCompare(b.label));
}
