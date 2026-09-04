import { describe, expect, it } from "vitest";
import {
  BuiltInCatalogProvider,
  PACK_STARTER_ALIASES,
  canonicalCatalogItemId,
  catalogSlotPoliciesForObject,
  getCatalogItem,
  isMaterialCompatibleWithSlot,
  isPackLegacyMaterialCompatibleWithSlot,
  isPackStarterAliasId,
  remapPackMaterialBindings,
  resolveCatalogAlias,
  resolvePackStarterAlias,
  setCatalogProvider,
} from ".";
import {
  createImportedAssetObject,
  createObjectRenderBinding,
  getPackagedImportedAsset,
} from "../livingRoom";
import {
  LIVING_ROOM_MATERIAL_IDS,
  createLivingRoomMaterials,
  livingRoomMaterialById,
} from "../livingRoom/materials";
import { tagsFromMaterialExtensions } from "./materialCompatibility";
import type { MaterialEntity } from "../interiorProject";

function resolveFromLibrary(
  materialId: string,
  library: readonly MaterialEntity[] = createLivingRoomMaterials(),
) {
  const project = library.find((material) => material.id === materialId);
  if (project) {
    return {
      id: project.id,
      kind: project.kind,
      tags: tagsFromMaterialExtensions(project.extensions),
    };
  }
  const living = livingRoomMaterialById(materialId);
  if (!living) return null;
  return {
    id: living.id,
    kind: living.kind,
    tags: tagsFromMaterialExtensions(living.extensions),
  };
}

describe("Phase 6 catalog aliases", () => {
  it("maps the four packaged starter ids to active Kenney replacements", () => {
    expect(PACK_STARTER_ALIASES.map((entry) => entry.aliasId)).toEqual([
      "pack:wardrobe-1",
      "pack:dresser-1",
      "pack:kitchen-cabinet-1",
      "pack:sofa-1",
    ]);
    expect(resolveCatalogAlias("pack:sofa-1")?.targetItemId).toBe("kenney:lounge-sofa");
    expect(canonicalCatalogItemId("kenney:lounge-sofa")).toBe("kenney:lounge-sofa");
    expect(isPackStarterAliasId("pack:wardrobe-1")).toBe(true);
    expect(isPackStarterAliasId("kenney:lounge-sofa")).toBe(false);
  });

  it("resolves pack aliases through the built-in provider", async () => {
    setCatalogProvider(new BuiltInCatalogProvider());
    for (const alias of PACK_STARTER_ALIASES) {
      const item = await getCatalogItem(alias.aliasId);
      expect(item?.id).toBe(alias.targetItemId);
      const resolved = resolvePackStarterAlias(alias.aliasId);
      expect(resolved?.model.objectKey).toMatch(/models_glb\/.+\.glb$/);
    }
    setCatalogProvider(null);
  });

  it("remaps only compatible finishes and falls back to slot defaults", () => {
    const library = createLivingRoomMaterials();
    const resolveMaterial = (id: string) => resolveFromLibrary(id, library);
    const legacy = {
      carcass: LIVING_ROOM_MATERIAL_IDS.naturalOak,
      fronts: LIVING_ROOM_MATERIAL_IDS.walnut,
    };
    const sofaPolicies = catalogSlotPoliciesForObject({
      catalogItemId: "kenney:lounge-sofa",
    })!;
    const sofa = remapPackMaterialBindings("pack:sofa-1", legacy, {
      slotPolicies: sofaPolicies,
      resolveMaterial,
    });
    expect(sofa.upholstery).toBe("material:core:fabric-oatmeal:v1");
    expect(sofa.legs).toBe(LIVING_ROOM_MATERIAL_IDS.walnut);
    expect(sofa.carcass).toBe(LIVING_ROOM_MATERIAL_IDS.naturalOak);

    const wardrobePolicies = catalogSlotPoliciesForObject({
      catalogItemId: "kenney:bookcase-open",
    })!;
    expect(
      remapPackMaterialBindings("pack:wardrobe-1", legacy, {
        slotPolicies: wardrobePolicies,
        resolveMaterial,
      }).body,
    ).toBe(LIVING_ROOM_MATERIAL_IDS.naturalOak);

    expect(remapPackMaterialBindings("pack:kitchen-cabinet-1", legacy)).toEqual(legacy);

    const fabricCarcass = remapPackMaterialBindings(
      "pack:sofa-1",
      { carcass: LIVING_ROOM_MATERIAL_IDS.oatmealFabric, fronts: LIVING_ROOM_MATERIAL_IDS.walnut },
      { slotPolicies: sofaPolicies, resolveMaterial },
    );
    expect(fabricCarcass.upholstery).toBe(LIVING_ROOM_MATERIAL_IDS.oatmealFabric);

    const rugCarcass = remapPackMaterialBindings(
      "pack:sofa-1",
      { carcass: LIVING_ROOM_MATERIAL_IDS.woolRug, fronts: LIVING_ROOM_MATERIAL_IDS.walnut },
      { slotPolicies: sofaPolicies, resolveMaterial },
    );
    expect(rugCarcass.upholstery).toBe("material:core:fabric-oatmeal:v1");
    expect(
      isMaterialCompatibleWithSlot(resolveMaterial(LIVING_ROOM_MATERIAL_IDS.woolRug)!, sofaPolicies.upholstery!),
    ).toBe(false);
    expect(
      isPackLegacyMaterialCompatibleWithSlot(
        resolveMaterial(LIVING_ROOM_MATERIAL_IDS.woolRug)!,
        sofaPolicies.upholstery!,
      ),
    ).toBe(false);
  });

  it("preserves project-owned custom finishes when remapping pack aliases", () => {
    const custom: MaterialEntity = {
      id: "finish-import-1",
      name: "Imported finish",
      kind: "custom",
      color: "#d8d0c4",
      roughness: 0.72,
      metalness: 0,
      opacity: 1,
      extensions: { createdBy: "import-finish" },
    };
    const library = [...createLivingRoomMaterials(), custom];
    expect(
      isMaterialCompatibleWithSlot(
        { id: custom.id, kind: custom.kind },
        catalogSlotPoliciesForObject({ catalogItemId: "kenney:lounge-sofa" })!.upholstery!,
      ),
    ).toBe(false);
    expect(
      isPackLegacyMaterialCompatibleWithSlot(
        { id: custom.id, kind: custom.kind },
        catalogSlotPoliciesForObject({ catalogItemId: "kenney:lounge-sofa" })!.upholstery!,
      ),
    ).toBe(true);
    const sofa = getPackagedImportedAsset("pack:sofa-1")!;
    const object = createImportedAssetObject(sofa, "sofa-1", "room-1", { x: 0, y: 0, z: 0 });
    object.materialSlots = {
      carcass: custom.id,
      fronts: LIVING_ROOM_MATERIAL_IDS.walnut,
    };
    const binding = createObjectRenderBinding(object, library);
    expect(binding.materialBindings.upholstery).toBe(custom.id);
    expect(binding.materialBindings.legs).toBe(LIVING_ROOM_MATERIAL_IDS.walnut);
  });

  it("applies remapped bindings on aliased render bindings", () => {
    const library = createLivingRoomMaterials();
    const sofa = getPackagedImportedAsset("pack:sofa-1")!;
    const object = createImportedAssetObject(sofa, "sofa-1", "room-1", { x: 0, y: 0, z: 0 });
    const binding = createObjectRenderBinding(object, library);
    expect(binding.materialBindings.upholstery).toBe(LIVING_ROOM_MATERIAL_IDS.oatmealFabric);
    expect(binding.materialBindings.legs).toBe(LIVING_ROOM_MATERIAL_IDS.walnut);
    expect(binding.slotPolicies?.upholstery?.sourceMaterialNames).toEqual(["carpet"]);

    const wardrobe = getPackagedImportedAsset("pack:wardrobe-1")!;
    const wardrobeObject = createImportedAssetObject(wardrobe, "ward-1", "room-1", {
      x: 0,
      y: 0,
      z: 0,
    });
    const wardrobeBinding = createObjectRenderBinding(wardrobeObject, library);
    expect(wardrobeBinding.materialBindings.body).toBe(LIVING_ROOM_MATERIAL_IDS.naturalOak);
    expect(wardrobeBinding.slotPolicies?.body?.sourceMaterialNames).toEqual(["wood"]);
  });
});
