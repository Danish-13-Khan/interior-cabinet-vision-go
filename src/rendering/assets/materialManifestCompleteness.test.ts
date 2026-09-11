import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { LIVING_ROOM_MATERIAL_IDS } from "../../domain/livingRoom/materials";
import { MATERIAL_ASSET_MANIFEST } from "./materialManifest";
import { TEXTURE_ASSET_MANIFEST } from "./textureManifest";
import { getTextureAsset, resolveMaterialTextureUrls } from "..";

const ROOT = join(process.cwd());

/** Soft-surface materials expected to have color + normal + roughness after Phase D. */
const PHASE_D_FULL_PBR_IDS = new Set([
  LIVING_ROOM_MATERIAL_IDS.naturalOak,
  LIVING_ROOM_MATERIAL_IDS.walnut,
  LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
  LIVING_ROOM_MATERIAL_IDS.oliveFabric,
  LIVING_ROOM_MATERIAL_IDS.woolRug,
  LIVING_ROOM_MATERIAL_IDS.wallPaint,
  LIVING_ROOM_MATERIAL_IDS.warmStone,
]);

describe("materialManifest Phase D completeness", () => {
  it("ships declared texture files for every available texture asset", () => {
    for (const texture of TEXTURE_ASSET_MANIFEST) {
      if (!texture.available) continue;
      expect(existsSync(join(ROOT, "public", texture.assetKey))).toBe(true);
      expect(getTextureAsset(texture.id)?.available).toBe(true);
    }
  });

  it("gives priority living-room materials color + normal + roughness maps", () => {
    for (const material of MATERIAL_ASSET_MANIFEST) {
      if (!PHASE_D_FULL_PBR_IDS.has(material.id)) continue;
      expect(material.colorMapId, material.id).toBeTruthy();
      expect(material.normalMapId, material.id).toBeTruthy();
      expect(material.roughnessMapId, material.id).toBeTruthy();
      const urls = resolveMaterialTextureUrls({
        id: material.id,
        name: material.name,
        kind: material.kind,
        color: material.baseColor,
        roughness: material.roughness,
        metalness: material.metalness,
        opacity: material.opacity,
        materialAssetId: material.id,
        uvScaleMm: material.uvScaleMm,
      });
      expect(urls.map).toBeTruthy();
      expect(urls.normalMap).toBeTruthy();
      expect(urls.roughnessMap).toBeTruthy();
    }
  });

  it("keeps glass and ceiling procedural without requiring full map sets", () => {
    const glass = MATERIAL_ASSET_MANIFEST.find(
      (entry) => entry.id === LIVING_ROOM_MATERIAL_IDS.clearGlass,
    );
    const ceiling = MATERIAL_ASSET_MANIFEST.find(
      (entry) => entry.id === LIVING_ROOM_MATERIAL_IDS.ceilingPaint,
    );
    expect(glass?.colorMapId).toBeUndefined();
    expect(ceiling?.colorMapId).toBeUndefined();
    expect(glass?.proceduralFallback).toBe(true);
    expect(ceiling?.proceduralFallback).toBe(true);
  });
});
