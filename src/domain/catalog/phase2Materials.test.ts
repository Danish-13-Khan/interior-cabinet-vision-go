import { describe, expect, it } from "vitest";
import {
  CATALOG_SEED_MATERIALS,
  filterMaterialsForSlot,
  getProofMaterialSlots,
  KENNEY_PROOF_STEMS,
  kenneyItemId,
  lookupBuiltInCatalogMaterial,
  matchSlotFromMaterialOrMeshName,
  mutateProjectMaterialCow,
  paintObjectSlotWithPolicy,
  resetObjectFinishToCatalogDefaults,
  snapshotCatalogMaterial,
  type CatalogItem,
} from ".";
import { createObjectRenderBinding, resolveEffectiveRenderStrategy } from "../livingRoom";
import type { InteriorProject, MaterialEntity } from "../interiorProject";
import manifestJson from "../../../public/catalog/builtin-catalog.v1.json";

function sofaItem(): CatalogItem {
  const item = (manifestJson as { items: CatalogItem[] }).items.find(
    (candidate) => candidate.id === kenneyItemId("loungeSofa"),
  );
  if (!item) throw new Error("missing sofa");
  return item;
}

function emptyProject(
  catalogItemId: string,
  materials: MaterialEntity[] = [],
  objectId = "obj-1",
): InteriorProject {
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
    objects: [
      {
        id: objectId,
        roomId: "room-1",
        kind: "furniture",
        category: "seating",
        catalogItemId,
        name: "Object",
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { widthMm: 2100, heightMm: 850, depthMm: 900 },
        materialSlots: {},
        parameters: {},
      },
    ],
    materials,
    lights: [],
    cameras: [],
    surfaces: [],
  } as InteriorProject;
}

describe("Phase 2 Kenney material adapter", () => {
  it("maps all eight proof stems by original GLB material name", () => {
    expect(KENNEY_PROOF_STEMS).toHaveLength(8);
    const sofa = getProofMaterialSlots("loungeSofa")!;
    expect(matchSlotFromMaterialOrMeshName({
      materialName: "carpet",
      meshName: "Mesh_0",
      slotPolicies: sofa,
    })).toBe("upholstery");
    expect(matchSlotFromMaterialOrMeshName({
      materialName: "wood",
      meshName: "Mesh_1",
      slotPolicies: sofa,
    })).toBe("legs");
    expect(matchSlotFromMaterialOrMeshName({
      materialName: "glass",
      meshName: "x",
      slotPolicies: getProofMaterialSlots("tableCoffeeGlass"),
    })).toBe("top");
    expect(matchSlotFromMaterialOrMeshName({
      materialName: "metalDark",
      meshName: "x",
      slotPolicies: getProofMaterialSlots("televisionModern"),
    })).toBe("screen");
    expect(matchSlotFromMaterialOrMeshName({
      materialName: "plant",
      meshName: "x",
      slotPolicies: getProofMaterialSlots("pottedPlant"),
    })).toBe("foliage");
  });

  it("filters incompatible finishes and locks protected surfaces", () => {
    const sofa = getProofMaterialSlots("loungeSofa")!;
    const fabricOnly = filterMaterialsForSlot(CATALOG_SEED_MATERIALS, sofa.upholstery!);
    expect(fabricOnly.every((material) => material.kind === "fabric" || material.kind === "custom")).toBe(true);
    expect(fabricOnly.some((material) => material.id.includes("oatmeal"))).toBe(true);
    expect(fabricOnly.some((material) => material.kind === "metal")).toBe(false);

    const tv = getProofMaterialSlots("televisionModern")!;
    expect(tv.screen!.editable).toBe(false);
    const screenDefault = lookupBuiltInCatalogMaterial(tv.screen!.defaultMaterialId!)!;
    const oatmeal = lookupBuiltInCatalogMaterial("material:core:fabric-oatmeal:v1")!;
    const metal = lookupBuiltInCatalogMaterial("material:core:metal-charcoal:v1")!;
    const tvProject = emptyProject(kenneyItemId("televisionModern"), [
      snapshotCatalogMaterial(screenDefault, "proj-screen"),
      snapshotCatalogMaterial(oatmeal, "proj-oatmeal"),
    ], "obj-tv");
    expect(() =>
      paintObjectSlotWithPolicy(tvProject, {
        objectId: "obj-tv",
        slotName: "screen",
        materialId: "proj-oatmeal",
      }),
    ).toThrow(/locked/);

    const sofaProject = emptyProject(kenneyItemId("loungeSofa"), [
      snapshotCatalogMaterial(oatmeal, "proj-oatmeal"),
      snapshotCatalogMaterial(metal, "proj-metal"),
    ], "obj-sofa");
    expect(() =>
      paintObjectSlotWithPolicy(sofaProject, {
        objectId: "obj-sofa",
        slotName: "upholstery",
        materialId: "proj-metal",
      }),
    ).toThrow(/incompatible/);
  });

  it("resets finishes to catalog defaults and clones shared materials on write", () => {
    const item = sofaItem();
    const reset = resetObjectFinishToCatalogDefaults(
      emptyProject(kenneyItemId("loungeSofa"), [], "obj-sofa"),
      "obj-sofa",
      item,
      CATALOG_SEED_MATERIALS,
    );
    const sofa = reset.objects[0]!;
    expect(sofa.materialSlots.upholstery).toBeTruthy();
    expect(sofa.materialSlots.legs).toBeTruthy();
    expect(sofa.catalogItemVersion).toBe(item.version);
    expect(sofa.extensions?.catalogItemVersion).toBeUndefined();
    expect(sofa.materialSlots.upholstery).not.toBe(sofa.materialSlots.legs);
    const upholsteryId = sofa.materialSlots.upholstery!;

    const customized = mutateProjectMaterialCow(reset, {
      materialId: upholsteryId,
      patch: { color: "#000000" },
    });
    const restored = resetObjectFinishToCatalogDefaults(customized, "obj-sofa", item, CATALOG_SEED_MATERIALS);
    const restoredMat = restored.materials.find(
      (material) => material.id === restored.objects[0]!.materialSlots.upholstery,
    );
    expect(restoredMat?.color).toBe("#d2c3ae");
    expect(restoredMat?.id).not.toBe(upholsteryId);

    const shared = {
      ...reset,
      objects: [
        sofa,
        {
          ...sofa,
          id: "obj-sofa-2",
          materialSlots: { ...sofa.materialSlots },
        },
      ],
    };
    const cow = mutateProjectMaterialCow(shared, {
      materialId: upholsteryId,
      patch: { color: "#112233" },
      rebind: { kind: "object", objectId: "obj-sofa", slotName: "upholstery" },
    });
    expect(cow.objects[0]!.materialSlots.upholstery).not.toBe(upholsteryId);
    expect(cow.objects[1]!.materialSlots.upholstery).toBe(upholsteryId);
    const clone = cow.materials.find((material) => material.id === cow.objects[0]!.materialSlots.upholstery);
    expect(clone?.color).toBe("#112233");
    expect(clone?.extensions?.catalogMaterialCustomized).toBe(true);
  });

  it("binds Kenney catalog GLBs with slot policies for production rendering", () => {
    const sofa = emptyProject(kenneyItemId("loungeSofa")).objects[0]!;
    const binding = createObjectRenderBinding(sofa);
    expect(binding.strategy).toBe("glb");
    expect(binding.modelUrl).toContain("loungeSofa.glb");
    expect(binding.slotPolicies?.upholstery?.sourceMaterialNames).toEqual(["carpet"]);
    expect(binding.preserveSourceMaterials).toBe(true);
    expect(resolveEffectiveRenderStrategy(binding, false)).toBe("glb");
  });
});
