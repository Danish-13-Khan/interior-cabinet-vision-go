import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  compileLivingRoomScene,
  createLivingRoomStarterProject,
  expectedStrategyForCatalogItem,
} from "../../domain/livingRoom";
import {
  getModelAsset,
  getTextureAsset,
  hasCuratedTextureUrls,
  listAvailableModelAssets,
  resolveMaterialTextureUrls,
  resolveModelAssetUrl,
} from "..";
import { LIVING_ROOM_MATERIAL_IDS } from "../../domain/livingRoom/materials";

const ROOT = join(process.cwd());

describe("curated living-room asset pack", () => {
  it("exposes the six soft-goods GLBs with normalized slot tokens", () => {
    const available = listAvailableModelAssets();
    expect(available.map((asset) => asset.id)).toEqual([
      "model:sofa-3-seat",
      "model:lounge-chair",
      "model:coffee-table",
      "model:side-table",
      "model:floor-lamp",
      "model:indoor-plant",
    ]);
    for (const asset of available) {
      expect(Object.keys(asset.materialGroups).length).toBeGreaterThan(0);
      expect(asset.nativeSizeMm.widthMm).toBeGreaterThan(0);
      expect(existsSync(join(ROOT, "public", asset.assetKey))).toBe(true);
    }
  });

  it("keeps millwork procedural and soft-goods GLB-intent", () => {
    expect(expectedStrategyForCatalogItem("living:sofa-3-seat")).toBe("glb");
    expect(expectedStrategyForCatalogItem("living:tv-unit")).toBe("procedural");
    expect(expectedStrategyForCatalogItem("living:bookcase")).toBe("procedural");
    const scene = compileLivingRoomScene(createLivingRoomStarterProject({
      now: "2026-08-12T18:00:00.000Z",
    }));
    const tv = scene.nodes.find((node) => node.metadata.catalogItemId === "living:tv-unit");
    expect(tv?.renderBinding.strategy).toBe("procedural");
    expect(getModelAsset("model:sofa-3-seat")?.available).toBe(true);
  });

  it("resolves curated PBR texture URLs with procedural-safe fallbacks", () => {
    const oak = getTextureAsset("tex:oak-color");
    expect(oak?.available).toBe(true);
    expect(resolveModelAssetUrl(oak!.assetKey)).toBe("/textures/wood/oak-color.png");
    expect(existsSync(join(ROOT, "public", oak!.assetKey))).toBe(true);

    const urls = resolveMaterialTextureUrls({
      id: LIVING_ROOM_MATERIAL_IDS.naturalOak,
      name: "Natural Oak",
      kind: "wood",
      color: "#b98a58",
      roughness: 0.62,
      metalness: 0,
      opacity: 1,
      materialAssetId: LIVING_ROOM_MATERIAL_IDS.naturalOak,
      uvScaleMm: 900,
    });
    expect(hasCuratedTextureUrls(urls)).toBe(true);
    expect(urls.map).toContain("oak-color.png");
    expect(urls.normalMap).toContain("oak-normal.png");
  });
});
