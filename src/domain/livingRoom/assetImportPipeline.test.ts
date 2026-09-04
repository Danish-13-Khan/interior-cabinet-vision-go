import { describe, expect, it } from "vitest";
import { createInteriorProjectFile, loadInteriorProjectFile } from "../interiorProject";
import {
  ASSET_IMPORT_STARTER_PACK,
  compileLivingRoomScene,
  createImportedAssetObject,
  createLivingRoomStarterProject,
} from ".";
import {
  PACK_STARTER_ALIASES,
  canonicalCatalogItemId,
  lookupCatalogItemResolvingAliases,
  resolvePackStarterAlias,
} from "../catalog";

describe("asset import pipeline", () => {
  it("compiles a packaged GLB asset and preserves its stable pack id through save/load", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-19T00:00:00.000Z" });
    const asset = ASSET_IMPORT_STARTER_PACK[0]!;
    const object = createImportedAssetObject(
      asset,
      "imported-wardrobe",
      project.activeRoomId,
      { x: 0, y: 0, z: 0 },
    );
    const next = { ...project, objects: [...project.objects, object] };
    const loaded = loadInteriorProjectFile(createInteriorProjectFile(next)).document;
    const imported = loaded.objects.find((item) => item.id === object.id)!;
    const node = compileLivingRoomScene(loaded).nodes.find(
      (item) => item.sourceObjectId === object.id,
    )!;
    expect(imported.extensions?.assetImport).toEqual({ id: asset.id });
    expect(node.renderBinding.strategy).toBe("glb");
    expect(node.renderBinding.modelUrl).toContain("bookcaseOpen");
    expect(node.renderBinding.modelUrl).not.toContain("fbx_with_texture");
    expect(node.placeholder).toBe(false);
  });

  it("keeps a user-imported GLB URL in the object binding", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-19T00:00:00.000Z" });
    const object = createImportedAssetObject(
      {
        id: "file:chair",
        name: "My Chair",
        category: "imported",
        kind: "custom",
        dimensions: { widthMm: 600, heightMm: 800, depthMm: 600 },
        sourceUrl: "data:model/gltf-binary;base64,AA==",
      },
      "imported-chair",
      project.activeRoomId,
      { x: 0, y: 0, z: 0 },
    );
    const node = compileLivingRoomScene({
      ...project,
      objects: [...project.objects, object],
    }).nodes.find((item) => item.sourceObjectId === object.id)!;
    expect(node.renderBinding.modelUrl).toBe("data:model/gltf-binary;base64,AA==");
  });
});

describe("Phase 6 pack starter aliases", () => {
  it("resolves every legacy pack id to a Kenney catalog model", () => {
    expect(PACK_STARTER_ALIASES).toHaveLength(4);
    expect(ASSET_IMPORT_STARTER_PACK.map((asset) => asset.id)).toEqual(
      PACK_STARTER_ALIASES.map((alias) => alias.aliasId),
    );
    for (const alias of PACK_STARTER_ALIASES) {
      const resolved = resolvePackStarterAlias(alias.aliasId);
      expect(resolved?.item.id).toBe(alias.targetItemId);
      expect(resolved?.modelUrl).toContain("kenney-furniture");
      expect(resolved?.modelUrl).not.toContain("fbx_with_texture");
      expect(canonicalCatalogItemId(alias.aliasId)).toBe(alias.targetItemId);
      expect(lookupCatalogItemResolvingAliases(alias.aliasId)?.id).toBe(alias.targetItemId);
    }
  });

  it("reopens projects that only store the pack id alias", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-04T00:00:00.000Z" });
    for (const asset of ASSET_IMPORT_STARTER_PACK) {
      const object = createImportedAssetObject(
        asset,
        `legacy-${asset.id}`,
        project.activeRoomId,
        { x: 0, y: 0, z: 0 },
      );
      project.objects = [...project.objects, object];
    }
    const loaded = loadInteriorProjectFile(createInteriorProjectFile(project)).document;
    const scene = compileLivingRoomScene(loaded);
    for (const asset of ASSET_IMPORT_STARTER_PACK) {
      const object = loaded.objects.find((item) => item.id === `legacy-${asset.id}`)!;
      expect(object.extensions?.assetImport).toEqual({ id: asset.id });
      const node = scene.nodes.find((item) => item.sourceObjectId === object.id)!;
      expect(node.renderBinding.strategy).toBe("glb");
      expect(node.renderBinding.modelUrl).toContain("kenney-furniture");
      expect(node.renderBinding.modelAssetId).toMatch(/^model:kenney:/);
    }
    const sofa = scene.nodes.find((item) => item.sourceObjectId === "legacy-pack:sofa-1")!;
    expect(sofa.renderBinding.materialBindings.upholstery).toBeTruthy();
    expect(sofa.renderBinding.materialBindings.legs).toBeTruthy();
    const wardrobe = scene.nodes.find((item) => item.sourceObjectId === "legacy-pack:wardrobe-1")!;
    expect(wardrobe.renderBinding.materialBindings.body).toBeTruthy();
  });
});
