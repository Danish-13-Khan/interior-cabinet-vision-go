import { describe, expect, it } from "vitest";
import { createPbrMaterialDescriptor } from "../../rendering/materials/createPbrMaterial";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import {
  applyMaterialContrastRoughness,
  resolveMaterialContrast,
} from "./materialContrast";
import type { CompiledMaterial } from "./sceneTypes";

function woodMaterial(): CompiledMaterial {
  return {
    id: LIVING_ROOM_MATERIAL_IDS.naturalOak,
    name: "Natural Oak",
    kind: "wood",
    color: "#b98a58",
    roughness: 0.62,
    metalness: 0,
    opacity: 1,
    materialAssetId: LIVING_ROOM_MATERIAL_IDS.naturalOak,
    uvScaleMm: 900,
  };
}

function fabricMaterial(): CompiledMaterial {
  return {
    id: LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
    name: "Oatmeal Weave",
    kind: "fabric",
    color: "#c8baa6",
    roughness: 0.96,
    metalness: 0,
    opacity: 1,
    materialAssetId: LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
    uvScaleMm: 450,
  };
}

function paintMaterial(): CompiledMaterial {
  return {
    id: LIVING_ROOM_MATERIAL_IDS.wallPaint,
    name: "Wall",
    kind: "paint",
    color: "#e9e3d8",
    roughness: 0.86,
    metalness: 0,
    opacity: 1,
    materialAssetId: LIVING_ROOM_MATERIAL_IDS.wallPaint,
    uvScaleMm: 2400,
  };
}

describe("materialContrast", () => {
  it("boosts wood clearcoat/env more than paint under Client Preview", () => {
    const wood = resolveMaterialContrast("wood", "hero", "client-preview");
    const paint = resolveMaterialContrast("paint", "hero", "client-preview");
    expect(wood.envBoost).toBeGreaterThan(paint.envBoost);
    expect(wood.clearcoatBoost).toBeGreaterThan(paint.clearcoatBoost);
    expect(wood.roughnessDelta).toBeLessThan(paint.roughnessDelta);
  });

  it("keeps fabric sheenier and wood glossier in hero PBR descriptors", () => {
    const draftWood = createPbrMaterialDescriptor(woodMaterial(), "preview", { quality: "draft" });
    const clientWood = createPbrMaterialDescriptor(woodMaterial(), "hero", { quality: "client-preview" });
    const draftFabric = createPbrMaterialDescriptor(fabricMaterial(), "preview", { quality: "draft" });
    const clientFabric = createPbrMaterialDescriptor(fabricMaterial(), "hero", { quality: "client-preview" });
    const clientPaint = createPbrMaterialDescriptor(paintMaterial(), "hero", { quality: "client-preview" });

    expect(clientWood.clearcoat).toBeGreaterThan(draftWood.clearcoat);
    expect(clientWood.envMapIntensity).toBeGreaterThan(draftWood.envMapIntensity);
    expect(clientWood.roughness).toBeLessThan(draftWood.roughness);
    expect(clientFabric.sheen).toBeGreaterThan(draftFabric.sheen);
    expect(clientWood.envMapIntensity).toBeGreaterThan(clientPaint.envMapIntensity);
  });

  it("clamps roughness into a valid range", () => {
    const tuning = resolveMaterialContrast("wood", "hero", "presentation");
    expect(applyMaterialContrastRoughness(0.01, tuning)).toBeGreaterThanOrEqual(0.02);
    expect(applyMaterialContrastRoughness(0.99, tuning)).toBeLessThanOrEqual(1);
  });
});
