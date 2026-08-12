import { describe, expect, it } from "vitest";
import {
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
} from "../interiorProject";
import {
  compileLivingRoomScene,
  createLivingRoomStarterProject,
  createObjectRenderBinding,
  expectedStrategyForCatalogItem,
  getRenderModeQuality,
  GLB_INTENT_CATALOG_IDS,
  resolveEffectiveRenderStrategy,
} from ".";

const NOW = "2026-08-12T12:00:00.000Z";

describe("living-room render asset bindings", () => {
  it("emits renderBinding on every compiled node", () => {
    const scene = compileLivingRoomScene(createLivingRoomStarterProject({ now: NOW }));
    expect(scene.nodes.length).toBeGreaterThan(0);
    expect(scene.nodes.every((node) => node.renderBinding != null)).toBe(true);
    expect(scene.materials.every((material) => material.materialAssetId && material.uvScaleMm > 0)).toBe(true);
  });

  it("maps known soft-goods catalog items to glb intent", () => {
    for (const catalogItemId of GLB_INTENT_CATALOG_IDS) {
      expect(expectedStrategyForCatalogItem(catalogItemId)).toBe("glb");
    }
    expect(expectedStrategyForCatalogItem("living:tv-unit")).toBe("procedural");
    expect(expectedStrategyForCatalogItem("living:bookcase")).toBe("procedural");
    expect(expectedStrategyForCatalogItem("living:area-rug")).toBe("procedural");
  });

  it("falls back to procedural when the model asset is missing", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const sofa = project.objects.find((object) => object.catalogItemId === "living:sofa-3-seat")!;
    const binding = createObjectRenderBinding(sofa);
    expect(binding.strategy).toBe("glb");
    expect(binding.modelAssetId).toBe("model:sofa-3-seat");
    expect(resolveEffectiveRenderStrategy(binding, false)).toBe("procedural");
    expect(resolveEffectiveRenderStrategy(binding, true)).toBe("glb");
  });

  it("keeps project JSON backward compatible without renderMode mutation", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const before = structuredClone(project);
    const mode = getRenderModeQuality("hero");
    expect(mode.mode).toBe("hero");
    expect(project).toEqual(before);
    expect("renderMode" in project).toBe(false);
    expect("renderMode" in project.renderSettings).toBe(false);

    const serialized = serializeInteriorProjectFile(project, NOW);
    const loaded = loadInteriorProjectFile(serialized);
    expect(loaded.document.renderSettings).toEqual(project.renderSettings);
    expect(JSON.stringify(serialized)).not.toContain("renderBinding");
    expect(JSON.stringify(serialized)).not.toContain("model:sofa");
  });
});
