import type { CatalogItem } from "./types";

export type DimensionFilter = {
  minWidthMm?: number;
  maxWidthMm?: number;
  minDepthMm?: number;
  maxDepthMm?: number;
};

export function itemMatchesDimensions(item: CatalogItem, filter: DimensionFilter): boolean {
  const width = item.dimensionsMm.width;
  const depth = item.dimensionsMm.depth;
  if (filter.minWidthMm !== undefined && width < filter.minWidthMm) return false;
  if (filter.maxWidthMm !== undefined && width > filter.maxWidthMm) return false;
  if (filter.minDepthMm !== undefined && depth < filter.minDepthMm) return false;
  if (filter.maxDepthMm !== undefined && depth > filter.maxDepthMm) return false;
  return true;
}

export function itemMatchesSubcategory(item: CatalogItem, subcategory?: string): boolean {
  if (!subcategory || subcategory === "all") return true;
  return item.subcategory === subcategory;
}

export function uniqueSubcategories(items: readonly CatalogItem[]): string[] {
  return [...new Set(items.map((item) => item.subcategory).filter(Boolean))].sort();
}

export function parseOptionalMm(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
