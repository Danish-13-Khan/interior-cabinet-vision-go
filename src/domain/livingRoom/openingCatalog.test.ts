import { describe, expect, it } from "vitest";
import { OPENING_CATALOG, createOpeningCatalogInstance, getOpeningCatalogItem, openingCatalogForKind } from "./openingCatalog";

describe("opening catalog", () => {
  it("ships two doors and two windows with procedural contracts", () => {
    expect(OPENING_CATALOG).toHaveLength(4);
    expect(openingCatalogForKind("door")).toHaveLength(2);
    expect(openingCatalogForKind("window")).toHaveLength(2);
    for (const item of OPENING_CATALOG) {
      expect(item.catalogItemId).toMatch(/^opening:/);
      expect(item.materialSlots.length).toBeGreaterThan(1);
      expect(item.defaults.widthMm).toBeGreaterThan(0);
      expect(item.generator).toMatch(/^procedural-/);
    }
  });

  it("provides a stable fallback", () => {
    expect(getOpeningCatalogItem("missing").catalogItemId).toBe("opening:door-single");
  });

  it("creates a catalog-backed instance with defaults, parameters, and override slots", () => {
    const opening = createOpeningCatalogInstance({ id: "door", roomId: "room", wallId: "wall", catalogItemId: "opening:door-double", offsetMm: 750 });
    expect(opening).toMatchObject({ kind: "door", widthMm: 1600, heightMm: 2200, sillHeightMm: 0, catalogItemId: "opening:door-double", offsetMm: 750, materialSlots: {}, parameters: { leafCount: 2 } });
  });
});
