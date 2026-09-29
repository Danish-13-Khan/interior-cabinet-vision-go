import { describe, expect, it } from "vitest";
import {
  assertPortableProjectFileByteLimit,
  MAX_INTERIOR_PROJECT_FILE_BYTES,
  MAX_PORTABLE_PROJECT_FILE_BYTES,
} from "../../interiorProject/fileFormatLimits";
import {
  createMemoryAssetBlobStore,
  hasEmbeddedAssetData,
  missingStoredAssetsMessage,
  pruneStoredAssets,
  STORED_ASSET_PRUNE_GRACE_MS,
  storeAssetBlob,
  storedAssetKey,
} from ".";

const GRACE = STORED_ASSET_PRUNE_GRACE_MS;

function withAsset(sourceUrl: string, textureUrls?: Record<string, string>) {
  return { objects: [{ extensions: { assetImport: { id: "file:x", sourceUrl, textureUrls } } }] };
}

describe("pruneStoredAssets", () => {
  it("deletes only unreferenced files older than the grace period", async () => {
    let clock = 0;
    const store = createMemoryAssetBlobStore(() => clock);
    const kept = await storeAssetBlob(store, new Blob(["kept"]));
    const texture = await storeAssetBlob(store, new Blob(["texture"]));
    const orphan = await storeAssetBlob(store, new Blob(["orphan"]));
    clock = 2 * GRACE;
    const fresh = await storeAssetBlob(store, new Blob(["fresh import"]));

    const removed = await pruneStoredAssets(store, [withAsset(kept, { map: texture })], { now: 2 * GRACE + 1 });

    expect(removed).toBe(1);
    expect(await store.get(storedAssetKey(orphan))).toBeNull();
    expect(await store.get(storedAssetKey(kept))).not.toBeNull();
    expect(await store.get(storedAssetKey(texture))).not.toBeNull();
    expect(await store.get(storedAssetKey(fresh))).not.toBeNull();
  });

  it("re-storing a file refreshes its age so it survives the next prune", async () => {
    let clock = 0;
    const store = createMemoryAssetBlobStore(() => clock);
    const ref = await storeAssetBlob(store, new Blob(["reopened"]));
    clock = 2 * GRACE;
    await storeAssetBlob(store, new Blob(["reopened"]));
    expect(await pruneStoredAssets(store, [], { now: 2 * GRACE + 1 })).toBe(0);
    expect(await store.get(storedAssetKey(ref))).not.toBeNull();
  });
});

describe("stored asset helpers", () => {
  it("detects inline model or texture bytes anywhere in a document", () => {
    expect(hasEmbeddedAssetData([withAsset("idb:abc")])).toBe(false);
    expect(hasEmbeddedAssetData([withAsset("data:model/gltf-binary;base64,AA==")])).toBe(true);
    expect(hasEmbeddedAssetData(withAsset("idb:abc", { map: "data:image/png;base64,AA==" }))).toBe(true);
    expect(hasEmbeddedAssetData({ thumbnail: "data:image/png;base64,AA==" })).toBe(false);
  });

  it("describes missing model files, counting each reference once", () => {
    expect(missingStoredAssetsMessage([])).toBeNull();
    expect(missingStoredAssetsMessage(["idb:a", "idb:a"])).toMatch(/^1 imported model file is missing/);
    expect(missingStoredAssetsMessage(["idb:a", "idb:b"])).toMatch(/^2 imported model files are missing/);
  });

  it("gives portable files room for a maximum-size model while keeping the document limit", () => {
    const embeddedMaxModel = Math.ceil((25 * 1024 * 1024 * 4) / 3);
    expect(MAX_INTERIOR_PROJECT_FILE_BYTES).toBe(25 * 1024 * 1024);
    expect(embeddedMaxModel).toBeLessThan(MAX_PORTABLE_PROJECT_FILE_BYTES);
    expect(() => assertPortableProjectFileByteLimit(MAX_PORTABLE_PROJECT_FILE_BYTES)).not.toThrow();
    expect(() => assertPortableProjectFileByteLimit(MAX_PORTABLE_PROJECT_FILE_BYTES + 1)).toThrow("150 MB");
  });
});
