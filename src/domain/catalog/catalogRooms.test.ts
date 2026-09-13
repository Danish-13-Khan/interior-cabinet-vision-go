import { describe, expect, it } from "vitest";
import type { CatalogItem } from "./types";
import {
  CATALOG_ROOM_TYPES,
  catalogItemServesRoom,
  catalogRoomLabel,
  roomsForCatalogItem,
} from "./catalogRooms";
import { listObjectBrowserItems } from "./objectBrowser";

function item(partial: Partial<CatalogItem>): CatalogItem {
  return {
    id: "item", version: 1, name: "Item", category: "seating", subcategory: "seating",
    tags: [], placement: "floor", dimensionsMm: { width: 100, height: 100, depth: 100 },
    modelAssetId: "model", images: {}, materialSlots: {}, lifecycle: "active",
    visibility: { objectBrowser: true, templateEligible: true },
    source: { pack: "kenney-furniture", licenseId: "cc0-1.0" },
    ...partial,
  } as CatalogItem;
}

describe("roomsForCatalogItem", () => {
  it("prefers an explicit rooms field", () => {
    expect(roomsForCatalogItem(item({ rooms: ["kitchen", "dining"] }))).toEqual(["kitchen", "dining"]);
  });

  it("accepts a room:* tag and drops unknown room names", () => {
    expect(roomsForCatalogItem(item({ tags: ["room:bedroom", "room:garage"] }))).toEqual(["bedroom"]);
  });

  it("derives from subcategory before category", () => {
    expect(roomsForCatalogItem(item({ category: "seating", subcategory: "sofas" }))).toEqual(["living-room"]);
    expect(roomsForCatalogItem(item({ category: "storage", subcategory: "media" }))).toEqual(["living-room"]);
  });

  it("puts chairs and tables in the dining view so dining is reachable", () => {
    expect(roomsForCatalogItem(item({ category: "seating", subcategory: "chairs" }))).toContain("dining");
    expect(roomsForCatalogItem(item({ category: "tables-and-desks", subcategory: "tables" }))).toContain("dining");
  });

  it("derives from category when the subcategory is unmapped", () => {
    expect(roomsForCatalogItem(item({ category: "bathroom", subcategory: "unknown" }))).toEqual(["bathroom"]);
  });

  it("treats architecture, decor and lighting as universal", () => {
    for (const category of ["architecture", "decor", "lighting"]) {
      expect(roomsForCatalogItem(item({ category, subcategory: "any" })))
        .toHaveLength(CATALOG_ROOM_TYPES.length);
    }
  });

  it("falls back to every room rather than hiding an unmapped item", () => {
    expect(roomsForCatalogItem(item({ category: "brand-new", subcategory: "brand-new" })))
      .toHaveLength(CATALOG_ROOM_TYPES.length);
  });
});

describe("catalogItemServesRoom", () => {
  it("passes everything through for all rooms", () => {
    const bathroomItem = item({ category: "bathroom", subcategory: "fixtures" });
    expect(catalogItemServesRoom(bathroomItem, "all")).toBe(true);
    expect(catalogItemServesRoom(bathroomItem, "")).toBe(true);
    expect(catalogItemServesRoom(bathroomItem, "kitchen")).toBe(false);
  });
});

describe("object browser room filter", () => {
  it("returns a non-empty subset for every room type", () => {
    const all = listObjectBrowserItems();
    expect(all.length).toBeGreaterThan(0);
    for (const room of CATALOG_ROOM_TYPES) {
      const filtered = listObjectBrowserItems({ room: room.id });
      expect(filtered.length, `${room.id} has no items`).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThanOrEqual(all.length);
    }
  });

  it("excludes bathroom fixtures from the kitchen view", () => {
    const kitchen = listObjectBrowserItems({ room: "kitchen" });
    expect(kitchen.some((entry) => entry.category === "bathroom")).toBe(false);
  });

  it("labels every room type", () => {
    for (const room of CATALOG_ROOM_TYPES) expect(catalogRoomLabel(room.id)).toBe(room.label);
  });
});
