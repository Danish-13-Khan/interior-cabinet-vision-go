import { describe, expect, it } from "vitest";
import { listObjectBrowserItems } from "./objectBrowser";
import { itemMatchesDimensions, parseOptionalMm, uniqueSubcategories } from "./objectBrowserQuery";
import type { CatalogItem } from "./types";

const sample = {
  dimensionsMm: { width: 1800, height: 800, depth: 900 },
} as CatalogItem;

describe("object browser dimension and type filters", () => {
  it("rejects items wider than the maximum", () => {
    expect(itemMatchesDimensions(sample, { maxWidthMm: 1600 })).toBe(false);
    expect(itemMatchesDimensions(sample, { maxWidthMm: 2000 })).toBe(true);
    expect(itemMatchesDimensions(sample, { minWidthMm: 2000 })).toBe(false);
  });

  it("parses empty width as unset", () => {
    expect(parseOptionalMm("")).toBeUndefined();
    expect(parseOptionalMm("0")).toBeUndefined();
    expect(parseOptionalMm("1200")).toBe(1200);
  });

  it("filters the live catalogue by subcategory and width", () => {
    const beds = listObjectBrowserItems({ subcategory: "beds" });
    expect(beds.length).toBeGreaterThan(0);
    expect(beds.every((item) => item.subcategory === "beds")).toBe(true);
    const narrow = listObjectBrowserItems({ maxWidthMm: 800 });
    expect(narrow.every((item) => item.dimensionsMm.width <= 800)).toBe(true);
    expect(uniqueSubcategories(listObjectBrowserItems({ categoryId: "beds" })).length).toBeGreaterThan(0);
  });
});
