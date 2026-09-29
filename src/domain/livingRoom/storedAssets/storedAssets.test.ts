import { describe, expect, it } from "vitest";
import { blobToDataUrl } from "../../../utils/dataUrl";
import { readImportedGlb } from "../assetImportPipeline";
import {
  createMemoryAssetBlobStore,
  embedStoredAssets,
  isStoredAssetRef,
  stashEmbeddedAssets,
  storeAssetBlob,
  storedAssetKey,
} from ".";

const glbBytes = new Uint8Array([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0]);

type TestProject = {
  name: string;
  objects: Array<{ id: string; extensions?: { assetImport: Record<string, unknown> } }>;
};

function projectWith(assetImport: Record<string, unknown>): TestProject {
  return { name: "Room", objects: [{ id: "chair", extensions: { assetImport } }, { id: "wall" }] };
}

describe("stored assets", () => {
  it("stores identical bytes once under a content-hash reference", async () => {
    const store = createMemoryAssetBlobStore();
    const first = await storeAssetBlob(store, new Blob([glbBytes]));
    const second = await storeAssetBlob(store, new Blob([glbBytes]));
    expect(isStoredAssetRef(first)).toBe(true);
    expect(storedAssetKey(first)).toMatch(/^sha256-[0-9a-f]{64}$/);
    expect(second).toBe(first);
    expect(store.size()).toBe(1);
  });

  it("imports a GLB and its textures as idb references, not data URLs", async () => {
    const store = createMemoryAssetBlobStore();
    const asset = await readImportedGlb([
      new File([glbBytes], "chair.glb", { type: "model/gltf-binary" }),
      new File([new Uint8Array([1, 2, 3])], "chair_BaseColor.png", { type: "image/png" }),
    ], store);
    expect(isStoredAssetRef(asset.sourceUrl)).toBe(true);
    expect(isStoredAssetRef(asset.textureUrls?.map)).toBe(true);
    expect(store.size()).toBe(2);
  });

  it("embeds stored bytes for a project file and stashes them back on open", async () => {
    const store = createMemoryAssetBlobStore();
    const ref = await storeAssetBlob(store, new Blob([glbBytes], { type: "model/gltf-binary" }));
    const project = projectWith({ id: "file:chair", sourceUrl: ref, textureUrls: { map: ref } });

    const { value: embedded, missing } = await embedStoredAssets(project, store);
    const embeddedAsset = embedded.objects[0]!.extensions!.assetImport;
    expect(missing).toEqual([]);
    expect(embeddedAsset.sourceUrl).toMatch(/^data:model\/gltf-binary;base64,/);
    expect(embeddedAsset.textureUrls).toEqual({ map: embeddedAsset.sourceUrl });
    expect(embedded.objects[1]).toEqual({ id: "wall" });
    expect(project.objects[0]!.extensions!.assetImport.sourceUrl).toBe(ref);

    const fresh = createMemoryAssetBlobStore();
    const reopened = await stashEmbeddedAssets(JSON.parse(JSON.stringify(embedded)) as TestProject, fresh);
    const reopenedAsset = reopened.objects[0]!.extensions!.assetImport;
    expect(reopenedAsset.sourceUrl).toBe(ref);
    const blob = await fresh.get(storedAssetKey(ref));
    expect(new Uint8Array(await blob!.arrayBuffer())).toEqual(glbBytes);
  });

  it("leaves unknown references and plain URLs untouched", async () => {
    const store = createMemoryAssetBlobStore();
    const project = projectWith({ id: "file:gone", sourceUrl: "idb:missing", textureUrls: { map: "/textures/oak.jpg" } });
    const { value, missing } = await embedStoredAssets(project, store);
    expect(missing).toEqual(["idb:missing"]);
    expect(value).toEqual(project);
  });

  it("keeps the data URL when the blob store cannot accept it", async () => {
    const failing = { get: async () => null, put: async () => { throw new Error("quota"); } };
    const dataUrl = await blobToDataUrl(new Blob([glbBytes], { type: "model/gltf-binary" }));
    const project = projectWith({ id: "file:chair", sourceUrl: dataUrl });
    const reopened = await stashEmbeddedAssets(project, failing);
    expect(reopened.objects[0]!.extensions!.assetImport.sourceUrl).toBe(dataUrl);
  });
});
