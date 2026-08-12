import { describe, expect, it } from "vitest";
import { LIVING_ROOM_MATERIAL_IDS } from "../../domain/livingRoom/materials";
import { createObjectRenderBinding } from "../../domain/livingRoom/renderAssetBindings";
import { createLivingRoomStarterProject } from "../../domain/livingRoom";
import {
  getMaterialAsset,
  isModelAssetAvailable,
  listMaterialAssets,
  resolveNodeDrawStrategy,
} from "../assets/assetRegistry";
import { createPbrMaterialDescriptor } from "../materials/createPbrMaterial";
import { textureRepeatFromUvScaleMm } from "../materials/materialScale";

const NOW = "2026-08-12T12:00:00.000Z";

describe("render asset registry and PBR spine", () => {
  it("resolves known living-room material asset IDs", () => {
    const ids = Object.values(LIVING_ROOM_MATERIAL_IDS);
    for (const id of ids) {
      const asset = getMaterialAsset(id);
      expect(asset, id).toBeTruthy();
      expect(asset?.proceduralFallback).toBe(true);
      expect(asset?.uvScaleMm).toBeGreaterThan(0);
    }
    expect(listMaterialAssets()).toHaveLength(ids.length);
  });

  it("uses procedural draw strategy while GLB placeholders are unavailable", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const sofa = project.objects.find((object) => object.catalogItemId === "living:sofa-3-seat")!;
    const binding = createObjectRenderBinding(sofa);
    expect(isModelAssetAvailable(binding.modelAssetId)).toBe(false);
    expect(resolveNodeDrawStrategy(binding)).toBe("procedural");
  });

  it("builds PBR descriptors for preview and hero without mutating project JSON", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const snapshot = structuredClone(project);
    const oak = project.materials.find((material) => material.id === LIVING_ROOM_MATERIAL_IDS.naturalOak)!;
    const compiled = {
      id: oak.id,
      name: oak.name,
      kind: oak.kind,
      color: oak.color,
      roughness: oak.roughness,
      metalness: oak.metalness,
      opacity: oak.opacity,
      materialAssetId: oak.id,
      uvScaleMm: 900,
    };
    const preview = createPbrMaterialDescriptor(compiled, "preview");
    const hero = createPbrMaterialDescriptor(compiled, "hero");
    expect(preview.asset?.id).toBe(oak.id);
    expect(hero.envMapIntensity).toBeGreaterThan(preview.envMapIntensity);
    expect(project).toEqual(snapshot);
    expect(textureRepeatFromUvScaleMm(900).x).toBeGreaterThan(0);
  });
});
