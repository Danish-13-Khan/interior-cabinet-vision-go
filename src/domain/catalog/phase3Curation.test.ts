import { describe, expect, it } from "vitest";
import { BUILTIN_CATALOG_MANIFEST as manifest } from "./builtinCatalogManifest";
import {
  isKenneyCabinetPropStem,
  isCanonicalCatalogSnapshot,
  kenneyItemId,
  KENNEY_CABINET_PROP_STEMS,
  KENNEY_TEMPLATE_CURATED_STEMS,
  lookupBuiltInCatalogMaterial,
  placeCatalogItemWithDefaults,
  validateCatalogManifest,
  type CatalogManifest,
} from ".";
import type { InteriorProject } from "../interiorProject";

const catalog = manifest as CatalogManifest;

function emptyProject(): InteriorProject {
  return {
    schemaVersion: 1,
    id: "p",
    name: "t",
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
    unitSystem: "mm",
    activeRoomId: "room-1",
    rooms: [{ id: "room-1", name: "Room", heightMm: 2700 }],
    walls: [],
    openings: [],
    objects: [],
    materials: [],
    lights: [],
    cameras: [],
    surfaces: [],
  } as InteriorProject;
}

describe("Phase 3 template-ready curation", () => {
  it("approves 30–35 template-eligible objects with thumbnails", () => {
    const eligible = catalog.items.filter((item) => item.visibility.templateEligible);
    expect(eligible.length).toBeGreaterThanOrEqual(30);
    expect(eligible.length).toBeLessThanOrEqual(35);
    expect(eligible).toHaveLength(KENNEY_TEMPLATE_CURATED_STEMS.length);
    for (const item of eligible) {
      expect(item.lifecycle).toBe("active");
      expect(item.visibility.objectBrowser).toBe(true);
      expect(item.images.thumbnailId).toBeTruthy();
      expect(item.dimensionsMm.width).toBeGreaterThan(0);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.category).not.toBe("architecture");
    }
    expect(validateCatalogManifest(catalog).filter((issue) => issue.level === "error")).toEqual([]);
  });

  it("keeps architecture and kitchen cabinet props out of templates", () => {
    for (const stem of KENNEY_TEMPLATE_CURATED_STEMS) {
      const item = catalog.items.find((candidate) => candidate.id === kenneyItemId(stem));
      expect(item?.visibility.templateEligible).toBe(true);
    }
    for (const item of catalog.items) {
      if (item.lifecycle === "blocked" || item.category === "architecture") {
        expect(item.visibility.templateEligible).toBe(false);
      }
      if (item.subcategory === "cabinet-props" || item.tags.includes("presentation-prop")) {
        expect(item.visibility.templateEligible).toBe(false);
      }
    }
    expect(KENNEY_CABINET_PROP_STEMS).toHaveLength(10);
    for (const stem of KENNEY_CABINET_PROP_STEMS) {
      expect(isKenneyCabinetPropStem(stem)).toBe(true);
      const item = catalog.items.find((candidate) => candidate.id === kenneyItemId(stem));
      expect(item?.visibility.templateEligible).toBe(false);
      expect(item?.subcategory).toBe("cabinet-props");
    }
  });

  it("uses realistic dimensions and default finishes for lounge sofa", () => {
    const sofa = catalog.items.find((item) => item.id === kenneyItemId("loungeSofa"))!;
    expect(sofa.dimensionsMm).toEqual({ width: 2100, height: 850, depth: 900 });
    expect(sofa.materialSlots.upholstery?.defaultMaterialId).toBe("material:core:fabric-oatmeal:v1");
    expect(sofa.images.thumbnailId).toBe("image:kenney:lounge-sofa:iso-ne:v1");
  });

  it("snapshots catalog finishes when placing a template-eligible item", () => {
    const placed = placeCatalogItemWithDefaults(emptyProject(), kenneyItemId("loungeSofa"), {
      objectId: "obj-sofa",
      roomId: "room-1",
      position: { x: 0, y: 0, z: 0 },
    });
    const object = placed.objects.find((candidate) => candidate.id === "obj-sofa")!;
    expect(object.dimensions).toEqual({ widthMm: 2100, heightMm: 850, depthMm: 900 });
    expect(object.materialSlots.upholstery).toBeTruthy();
    expect(object.materialSlots.legs).toBeTruthy();
    expect(object.catalogItemVersion).toBe(1);
    const oatmeal = lookupBuiltInCatalogMaterial("material:core:fabric-oatmeal:v1")!;
    const snap = placed.materials.find((material) => material.id === object.materialSlots.upholstery)!;
    expect(isCanonicalCatalogSnapshot(snap, oatmeal)).toBe(true);
  });

  it("rejects placing blocked or non-eligible catalog items", () => {
    expect(() =>
      placeCatalogItemWithDefaults(emptyProject(), kenneyItemId("wall"), {
        objectId: "x",
        roomId: "room-1",
        position: { x: 0, y: 0, z: 0 },
      }),
    ).toThrow(/blocked/);
    expect(() =>
      placeCatalogItemWithDefaults(emptyProject(), kenneyItemId("kitchenCabinet"), {
        objectId: "x",
        roomId: "room-1",
        position: { x: 0, y: 0, z: 0 },
      }),
    ).toThrow(/not template-eligible/);
  });

  it("rejects reused placement object ids", () => {
    const first = placeCatalogItemWithDefaults(emptyProject(), kenneyItemId("loungeSofa"), {
      objectId: "obj-sofa",
      roomId: "room-1",
      position: { x: 0, y: 0, z: 0 },
    });
    const originalSlots = { ...first.objects[0]!.materialSlots };
    expect(() =>
      placeCatalogItemWithDefaults(first, kenneyItemId("loungeChair"), {
        objectId: "obj-sofa",
        roomId: "room-1",
        position: { x: 1000, y: 0, z: 0 },
      }),
    ).toThrow(/already exists/);
    expect(first.objects).toHaveLength(1);
    expect(first.objects[0]!.materialSlots).toEqual(originalSlots);
  });
});
