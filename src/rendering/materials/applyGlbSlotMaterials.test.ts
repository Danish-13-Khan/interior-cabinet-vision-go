import { describe, expect, it, vi } from "vitest";
import { resolveModelViewMaterialQuality } from "../../domain/livingRoom/modelViewPreviewDefaults";
import {
  resolveGlbMaterialBuildContext,
} from "./applyGlbSlotMaterials";

const descriptorSpy = vi.fn(() => ({
  color: "#cccccc",
  roughness: 0.7,
  metalness: 0,
  opacity: 1,
  transparent: false,
  depthWrite: true,
  transmission: 0,
  thickness: 0,
  ior: 1.45,
  clearcoat: 0,
  clearcoatRoughness: 0.78,
  sheen: 0,
  sheenColor: "#000000",
  sheenRoughness: 1,
  envMapIntensity: 0.5,
  specularIntensity: 1,
  maps: { map: undefined, bumpMap: undefined, bumpScale: 0.008 },
  bumpScale: 0.008,
  asset: null,
}));

vi.mock("./createPbrMaterial", () => ({
  createPbrMaterialDescriptor: (...args: unknown[]) => descriptorSpy(...args),
}));

vi.mock("./resolveMaterialTextureUrls", () => ({
  resolveMaterialTextureUrls: () => ({}),
}));

describe("GLB model-view material build context", () => {
  it("routes model-view quality through preview modeQuality and anisotropy", () => {
    const draft = resolveGlbMaterialBuildContext({
      renderQuality: "draft",
      modelViewQuality: "draft",
      mode: "preview",
    });
    const standard = resolveGlbMaterialBuildContext({
      renderQuality: "standard",
      modelViewQuality: "standard",
      mode: "preview",
    });

    expect(draft.modelViewPreview).toBe(true);
    expect(draft.modeQuality?.textureDetail).toBe("low");
    expect(draft.anisotropy).toBe(6);
    expect(standard.modeQuality?.textureDetail).toBe("high");
    expect(standard.anisotropy).toBe(10);
    expect(standard.anisotropy).toBeGreaterThan(draft.anisotropy);
  });

  it("passes model-view flags into createPbrMaterialDescriptor for GLB meshes", async () => {
    descriptorSpy.mockClear();
    const { applyGlbSlotMaterials } = await import("./applyGlbSlotMaterials");
    const { Mesh, BoxGeometry, MeshBasicMaterial, Group } = await import("three");
    const compiled = {
      id: "lr-material-natural-oak",
      name: "Natural Oak",
      kind: "wood" as const,
      color: "#aa8467",
      roughness: 0.66,
      metalness: 0,
      opacity: 1,
      materialAssetId: "lr-material-natural-oak",
      uvScaleMm: 1000,
    };
    const root = new Group();
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    mesh.name = "upholstery";
    root.add(mesh);

    applyGlbSlotMaterials(root, {
      materialGroups: { upholstery: "upholstery" },
      materialBindings: { upholstery: compiled.id },
      materials: new Map([[compiled.id, compiled]]),
      renderMode: "preview",
      renderQuality: "standard",
      modelViewQuality: "standard",
      castShadow: false,
      receiveShadow: true,
    });

    expect(descriptorSpy).toHaveBeenCalledWith(
      compiled,
      "preview",
      expect.objectContaining({
        quality: "standard",
        modeQuality: resolveModelViewMaterialQuality("standard"),
        modelViewPreview: true,
      }),
    );
  });
});
