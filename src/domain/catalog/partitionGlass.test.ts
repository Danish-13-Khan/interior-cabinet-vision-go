import { describe, expect, it } from "vitest";
import {
  CATALOG_SEED_MATERIALS,
  filterMaterialsForSlot,
  getCatalogSeedMaterial,
  getProofMaterialSlots,
  instantiateBathroomCatalogTemplate,
  lookupBuiltInCatalogItem,
  lookupBuiltInCatalogMaterial,
  paintObjectSlotFromCatalog,
  paintObjectSlotWithPolicy,
} from ".";
import { loadInteriorProjectFile, serializeInteriorProjectFile } from "../interiorProject";
import {
  PARTITION_GLASS_CATALOG_IDS,
  PARTITION_GLASS_TAG,
  SHOWER_GLASS_SLOT_TAGS,
} from "./partitionGlass";
import { wallContextMenuEntries } from "../livingRoom/wallContextMenu";

describe("partition glass library", () => {
  it("ships fluted, brown-tinted, matte, rough, and toughened finishes", () => {
    for (const id of PARTITION_GLASS_CATALOG_IDS) {
      const seed = getCatalogSeedMaterial(id);
      expect(seed, id).toBeTruthy();
      expect(seed?.kind).toBe("glass");
      expect(seed?.visibleInPicker).toBe(true);
      expect(seed?.tags).toContain(PARTITION_GLASS_TAG);
    }
    expect(getCatalogSeedMaterial("material:core:glass-fluted:v1")?.name).toBe("Fluted Glass");
    expect(getCatalogSeedMaterial("material:core:glass-brown-tinted:v1")?.name).toBe("Brown Tinted Glass");
    expect(getCatalogSeedMaterial("material:core:glass-matte:v1")?.name).toBe("Matte Glass");
    expect(getCatalogSeedMaterial("material:core:glass-rough:v1")?.name).toBe("Rough Finish Glass");
    expect(getCatalogSeedMaterial("material:core:glass-toughened:v1")?.name).toBe("Toughened Clear Glass");
  });

  it("treats toughened glass as a specification of clear, not a distinct look", () => {
    const clear = getCatalogSeedMaterial("material:core:glass-clear:v1")!;
    const toughened = getCatalogSeedMaterial("material:core:glass-toughened:v1")!;
    expect(toughened.baseColor).toBe(clear.baseColor);
    expect(toughened.roughness).toBe(clear.roughness);
    expect(toughened.opacity).toBe(clear.opacity);
    expect(toughened.tags).toContain("toughened-glass");
  });

  it("offers the partition set on shower glass and keeps screens/mirrors out", () => {
    const shower = getProofMaterialSlots("shower")!.showerGlass!;
    const choices = filterMaterialsForSlot(CATALOG_SEED_MATERIALS, shower);
    const ids = choices.map((material) => material.id);
    expect(shower.allowedMaterialTags).toEqual([...SHOWER_GLASS_SLOT_TAGS]);
    expect(lookupBuiltInCatalogItem("kenney:shower")?.materialSlots.showerGlass?.allowedMaterialTags)
      .toEqual([...SHOWER_GLASS_SLOT_TAGS]);
    expect(ids.sort()).toEqual([...PARTITION_GLASS_CATALOG_IDS].sort());
    expect(ids).not.toContain("material:core:glass-dark:v1");
    expect(ids).not.toContain("material:core:glass-mirror:v1");
  });

  it("keeps the builtin catalog in sync once generated", () => {
    for (const id of PARTITION_GLASS_CATALOG_IDS) {
      const catalog = lookupBuiltInCatalogMaterial(id);
      expect(catalog?.tags, id).toContain(PARTITION_GLASS_TAG);
    }
  });

  it("paints shower glass with a new partition finish and survives reopen", () => {
    const project = instantiateBathroomCatalogTemplate({
      projectId: "ba-glass",
      now: "2026-09-21T00:00:00.000Z",
    });
    const shower = project.objects.find((object) => object.catalogItemId === "kenney:shower")!;
    const painted = paintObjectSlotFromCatalog(project, {
      objectId: shower.id,
      slotName: "showerGlass",
      catalogMaterialId: "material:core:glass-fluted:v1",
    });
    const nextShower = painted.objects.find((object) => object.id === shower.id)!;
    const fluted = painted.materials.find((material) => material.id === nextShower.materialSlots.showerGlass)!;
    expect(fluted.extensions?.catalogMaterialId).toBe("material:core:glass-fluted:v1");

    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(painted)).document;
    const reopenedShower = reopened.objects.find((object) => object.catalogItemId === "kenney:shower")!;
    const reopenedGlass = reopened.materials.find(
      (material) => material.id === reopenedShower.materialSlots.showerGlass,
    )!;
    expect(reopenedGlass.extensions?.catalogMaterialId).toBe("material:core:glass-fluted:v1");
    expect(reopenedGlass.name).toBe("Fluted Glass");
  });

  it("still accepts older clear-glass snapshots that lack partition-glass", () => {
    const project = instantiateBathroomCatalogTemplate({
      projectId: "ba-legacy-glass",
      now: "2026-09-21T00:00:00.000Z",
    });
    const shower = project.objects.find((object) => object.catalogItemId === "kenney:shower")!;
    const glassId = shower.materialSlots.showerGlass!;
    const legacy = {
      ...project,
      materials: project.materials.map((material) =>
        material.id === glassId
          ? { ...material, extensions: { ...material.extensions, tags: ["clear-glass"] } }
          : material,
      ),
    };
    expect(() => paintObjectSlotWithPolicy(legacy, {
      objectId: shower.id,
      slotName: "showerGlass",
      materialId: glassId,
    })).not.toThrow();
    expect(() => paintObjectSlotFromCatalog(legacy, {
      objectId: shower.id,
      slotName: "showerGlass",
      catalogMaterialId: "material:core:glass-clear:v1",
    })).not.toThrow();
  });
});

describe("wall context menu", () => {
  it("lists hide, apply-material children, and clear", () => {
    const entries = wallContextMenuEntries([
      { id: "paint-a", name: "Warm White" },
      { id: "oak", name: "Natural Oak" },
    ]);
    expect(entries.map((entry) => entry.id)).toEqual([
      "hide-wall",
      "sep-materials",
      "apply-material",
      "clear-wall-material",
    ]);
    const apply = entries.find((entry) => entry.id === "apply-material");
    expect(apply?.label).toBe("Apply Material to Selected Object");
    expect(apply?.children?.map((child) => child.materialId)).toEqual(["paint-a", "oak"]);
  });
});
