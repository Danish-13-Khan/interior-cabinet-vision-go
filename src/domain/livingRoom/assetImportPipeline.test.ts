import { describe, expect, it } from "vitest";
import { createInteriorProjectFile, loadInteriorProjectFile } from "../interiorProject";
import {
  ASSET_IMPORT_STARTER_PACK,
  compileLivingRoomScene,
  createImportedAssetObject,
  createLivingRoomStarterProject,
} from ".";

describe("asset import pipeline", () => {
  it("compiles a packaged GLB asset and preserves its stable pack id through save/load", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-19T00:00:00.000Z" });
    const asset = ASSET_IMPORT_STARTER_PACK[0]!;
    const object = createImportedAssetObject(asset, "imported-wardrobe", project.activeRoomId, { x: 0, y: 0, z: 0 });
    const next = { ...project, objects: [...project.objects, object] };
    const loaded = loadInteriorProjectFile(createInteriorProjectFile(next)).document;
    const imported = loaded.objects.find((item) => item.id === object.id)!;
    const node = compileLivingRoomScene(loaded).nodes.find((item) => item.sourceObjectId === object.id)!;
    expect(imported.extensions?.assetImport).toEqual({ id: asset.id });
    expect(node.renderBinding.strategy).toBe("glb");
    expect(node.renderBinding.modelUrl).toContain("wardrobe1");
    expect(node.placeholder).toBe(false);
  });

  it("keeps a user-imported GLB URL in the object binding", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-19T00:00:00.000Z" });
    const object = createImportedAssetObject({
      id: "file:chair", name: "My Chair", category: "imported", kind: "custom",
      dimensions: { widthMm: 600, heightMm: 800, depthMm: 600 }, sourceUrl: "data:model/gltf-binary;base64,AA==",
    }, "imported-chair", project.activeRoomId, { x: 0, y: 0, z: 0 });
    const node = compileLivingRoomScene({ ...project, objects: [...project.objects, object] }).nodes.find((item) => item.sourceObjectId === object.id)!;
    expect(node.renderBinding.modelUrl).toBe("data:model/gltf-binary;base64,AA==");
  });
});
