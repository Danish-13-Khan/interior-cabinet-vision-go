import { describe, expect, it } from "vitest";
import {
  compileLivingRoomScene,
  computeGlbScaleFromNativeSize,
  createLivingRoomStarterProject,
  createObjectRenderBinding,
  expectedStrategyForCatalogItem,
  matchMaterialSlotForName,
  resolveEffectiveRenderStrategy,
} from ".";
import {
  getModelAsset,
  isModelAssetAvailable,
  listAvailableModelAssets,
  resolveModelAssetUrl,
  resolveNodeDrawStrategy,
} from "../../rendering/assets/assetRegistry";

const NOW = "2026-08-12T14:30:00.000Z";

describe("GLB furniture loader bindings", () => {
  it("resolves GLB strategy for soft-goods catalog items with available assets", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const sofa = project.objects.find((object) => object.catalogItemId === "living:sofa-3-seat")!;
    const binding = createObjectRenderBinding(sofa);
    expect(binding.strategy).toBe("glb");
    expect(binding.modelAssetId).toBe("model:sofa-3-seat");
    expect(binding.targetSizeMm).toEqual(sofa.dimensions);
    expect(isModelAssetAvailable(binding.modelAssetId)).toBe(true);
    expect(resolveNodeDrawStrategy(binding)).toBe("glb");
    expect(resolveModelAssetUrl(getModelAsset(binding.modelAssetId!)!.assetKey)).toBe(
      "/models/soft-goods/sofa-3-seat.glb",
    );
  });

  it("falls back to procedural when GLB is missing from the registry", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const sofa = project.objects.find((object) => object.catalogItemId === "living:sofa-3-seat")!;
    const binding = createObjectRenderBinding(sofa);
    expect(resolveEffectiveRenderStrategy(binding, false)).toBe("procedural");

    const sectional = {
      ...sofa,
      id: "sectional-temp",
      catalogItemId: "living:sofa-sectional",
    };
    const sectionalBinding = createObjectRenderBinding(sectional);
    expect(expectedStrategyForCatalogItem("living:sofa-sectional")).toBe("glb");
    expect(isModelAssetAvailable(sectionalBinding.modelAssetId)).toBe(false);
    expect(resolveNodeDrawStrategy(sectionalBinding)).toBe("procedural");
  });

  it("computes GLB scale factors from object dimensions", () => {
    const scale = computeGlbScaleFromNativeSize(
      { widthMm: 2400, heightMm: 900, depthMm: 1000 },
      { widthMm: 2200, heightMm: 820, depthMm: 920 },
    );
    expect(scale.x).toBeCloseTo(2400 / 2200, 5);
    expect(scale.y).toBeCloseTo(900 / 820, 5);
    expect(scale.z).toBeCloseTo(1000 / 920, 5);
  });

  it("keeps cabinets and millwork procedural", () => {
    expect(expectedStrategyForCatalogItem("living:tv-unit")).toBe("procedural");
    expect(expectedStrategyForCatalogItem("living:bookcase")).toBe("procedural");
    const scene = compileLivingRoomScene(createLivingRoomStarterProject({ now: NOW }));
    const millwork = scene.nodes.filter((node) =>
      ["living:tv-unit", "living:area-rug", "living:wall-mirror"].includes(
        String(node.metadata.catalogItemId),
      ),
    );
    expect(millwork.length).toBeGreaterThan(0);
    expect(millwork.every((node) => node.renderBinding.strategy === "procedural")).toBe(true);
    expect(listAvailableModelAssets().map((asset) => asset.id)).toEqual([
      "model:sofa-3-seat",
      "model:lounge-chair",
      "model:coffee-table",
      "model:side-table",
      "model:floor-lamp",
      "model:indoor-plant",
    ]);
  });

  it("matches GLB mesh names to material slots", () => {
    expect(matchMaterialSlotForName("upholstery_body", { upholstery: "upholstery", legs: "legs" }))
      .toBe("upholstery");
    expect(matchMaterialSlotForName("legs_fl", { upholstery: "upholstery", legs: "legs" }))
      .toBe("legs");
    expect(matchMaterialSlotForName("unknown", { top: "top" })).toBeNull();
  });
});
