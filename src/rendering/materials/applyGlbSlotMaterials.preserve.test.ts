import { describe, expect, it, vi } from "vitest";

vi.mock("./createPbrMaterial", () => ({
  createPbrMaterialDescriptor: vi.fn(() => ({
    color: "#cccccc", roughness: 0.7, metalness: 0, opacity: 1,
    transparent: false, depthWrite: true, transmission: 0, thickness: 0,
    ior: 1.45, clearcoat: 0, clearcoatRoughness: 0.78, sheen: 0,
    sheenColor: "#000000", sheenRoughness: 1, envMapIntensity: 0.5,
    specularIntensity: 1, maps: {}, bumpScale: 0.008, asset: null,
  })),
}));

vi.mock("./resolveMaterialTextureUrls", () => ({
  resolveMaterialTextureUrls: () => ({}),
}));

describe("preserve Kenney source materials", () => {
  it("applies catalog finishes when preserve is set but GLB has no baked map", async () => {
    const { applyGlbSlotMaterials } = await import("./applyGlbSlotMaterials");
    const { Mesh, BoxGeometry, MeshBasicMaterial, Group, Color } = await import("three");
    const compiled = {
      id: "proj-upholstery", name: "Oatmeal", kind: "fabric" as const,
      color: "#d2c3ae", roughness: 0.97, metalness: 0, opacity: 1,
      materialAssetId: "lr-material-fabric-oatmeal", uvScaleMm: 450,
    };
    const root = new Group();
    const source = new MeshBasicMaterial({ name: "carpet", color: new Color("#c43c3c") });
    const mesh = new Mesh(new BoxGeometry(), source);
    mesh.name = "upholstery";
    root.add(mesh);
    applyGlbSlotMaterials(root, {
      materialGroups: { upholstery: "upholstery" },
      materialBindings: { upholstery: compiled.id },
      materials: new Map([[compiled.id, compiled]]),
      renderMode: "preview",
      renderQuality: "standard",
      castShadow: false,
      receiveShadow: true,
      preserveSourceMaterials: true,
    });
    expect(mesh.material).not.toBe(source);
  });

  it("keeps source materials when preserve is set and a color map is baked", async () => {
    const { applyGlbSlotMaterials } = await import("./applyGlbSlotMaterials");
    const { Mesh, BoxGeometry, MeshStandardMaterial, Group, Color, Texture } = await import("three");
    const compiled = {
      id: "proj-upholstery", name: "Oatmeal", kind: "fabric" as const,
      color: "#d2c3ae", roughness: 0.97, metalness: 0, opacity: 1,
      materialAssetId: "lr-material-fabric-oatmeal", uvScaleMm: 450,
    };
    const root = new Group();
    const source = new MeshStandardMaterial({
      name: "carpet",
      color: new Color("#c43c3c"),
      map: new Texture(),
    });
    const mesh = new Mesh(new BoxGeometry(), source);
    root.add(mesh);
    applyGlbSlotMaterials(root, {
      materialGroups: { upholstery: "upholstery" },
      materialBindings: { upholstery: compiled.id },
      materials: new Map([[compiled.id, compiled]]),
      renderMode: "preview",
      renderQuality: "standard",
      castShadow: false,
      receiveShadow: true,
      preserveSourceMaterials: true,
    });
    expect(mesh.material).toBe(source);
  });
});
