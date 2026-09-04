import type { CatalogItem, CatalogQuery } from "../types";

export function matchesCatalogQuery(item: CatalogItem, query?: CatalogQuery): boolean {
  if (!query) return true;
  if (query.lifecycle && item.lifecycle !== query.lifecycle) return false;
  if (query.category && item.category !== query.category) return false;
  if (query.objectBrowser !== undefined && item.visibility.objectBrowser !== query.objectBrowser) {
    return false;
  }
  if (
    query.templateEligible !== undefined &&
    item.visibility.templateEligible !== query.templateEligible
  ) {
    return false;
  }
  if (query.text) {
    const needle = query.text.trim().toLowerCase();
    if (!needle) return true;
    const haystack = [item.name, item.category, item.subcategory, ...item.tags]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}
