import { unzipSync, zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { createMemoryAssetBlobStore, storeAssetBlob, storedAssetKey } from "../../domain/livingRoom/storedAssets";
import { createMemoryDraftStore } from "../../domain/projectDrafts/types";
import { parseProjectFileText } from "../projectFileAssets";
import { parseSavedProject } from "../savedProjectFile";
import { packCabinetArchive } from "./pack";
import { unpackCabinetArchive } from "./unpack";

const preview = { bounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 }, layers: [] };

async function projectWithAssets() {
  const store = createMemoryAssetBlobStore();
  const glb = new Uint8Array([0x67, 0x6c, 0x54, 0x46, 1, 2, 3, 4]);
  const png = new Uint8Array([137, 80, 78, 71, 1]);
  const modelRef = await storeAssetBlob(store, new Blob([glb], { type: "model/gltf-binary" }));
  const textureRef = await storeAssetBlob(store, new Blob([png], { type: "image/png" }));
  const document = {
    id: "proj-1",
    schemaVersion: 2,
    updatedAt: "2026-09-29T00:00:00.000Z",
    name: "Living room",
    objects: [{ extensions: { assetImport: { sourceUrl: modelRef, textureUrls: { map: textureRef } } } }],
    extensions: { planUnderlay: { id: "plan-1", fileName: "room.dwg", dwg: { preview, hiddenLayers: ["A"] } } },
  };
  return { store, document, glb, png, modelRef };
}

describe("cabinet archive", () => {
  it("round-trips the document, every blob, and the underlay", async () => {
    const { store, document, glb, png } = await projectWithAssets();
    const packed = await packCabinetArchive(document, store, "data:image/png;base64,AQID");
    const unzipped = unzipSync(packed.bytes);
    expect(unzipped["thumbnail.png"]).toBeTruthy();
    expect(Object.keys(unzipped).some((name) => name.startsWith("models/") && name.endsWith(".glb"))).toBe(true);
    const drafts = createMemoryDraftStore();
    const opened = await parseSavedProject({ path: "room.cabinet", kind: "cabinet", bytes: packed.bytes.buffer.slice(packed.bytes.byteOffset, packed.bytes.byteOffset + packed.bytes.byteLength) }, createMemoryAssetBlobStore(), drafts);
    const asset = (opened as { objects: { extensions: { assetImport: { sourceUrl: string; textureUrls: { map: string } } } }[] }).objects[0]!.extensions.assetImport;
    const next = createMemoryAssetBlobStore();
    await next.put("ignored", new Blob());
    const reopenedStore = drafts;
    expect(reopenedStore.get("proj-1")).toBeTruthy();
    const draft = await drafts.get("proj-1");
    expect(draft?.lastFileSaveAt).toBeTruthy();
    expect(JSON.stringify(draft?.document)).not.toContain("dataUrl");
    const blobs = createMemoryAssetBlobStore();
    const again = await unpackCabinetArchive(packed.bytes, blobs);
    const againAsset = (again.document as typeof opened & object) as { objects: { extensions: { assetImport: { sourceUrl: string; textureUrls: { map: string } } } }[] };
    const model = await blobs.get(storedAssetKey(againAsset.objects[0]!.extensions.assetImport.sourceUrl));
    const texture = await blobs.get(storedAssetKey(againAsset.objects[0]!.extensions.assetImport.textureUrls.map));
    expect(new Uint8Array(await model!.arrayBuffer())).toEqual(glb);
    expect(new Uint8Array(await texture!.arrayBuffer())).toEqual(png);
    expect(again.missing).toEqual([]);
    expect(asset.sourceUrl.startsWith("idb:")).toBe(true);
    const glbName = Object.keys(unzipped).find((name) => name.endsWith(".glb"));
    expect(glbName).toBeTruthy();
    expect(compressionMethod(packed.bytes, glbName!)).toBe(0);
    expect(compressionMethod(packed.bytes, "thumbnail.png")).toBe(0);
  });

  function compressionMethod(zip: Uint8Array, name: string): number | null {
    const encoded = new TextEncoder().encode(name);
    for (let index = 0; index + 30 + encoded.length < zip.length; index += 1) {
      if (zip[index] !== 0x50 || zip[index + 1] !== 0x4b || zip[index + 2] !== 3 || zip[index + 3] !== 4) continue;
      const nameLength = zip[index + 26]! | (zip[index + 27]! << 8);
      const start = index + 30;
      const slice = zip.subarray(start, start + nameLength);
      if (slice.length === encoded.length && encoded.every((byte, offset) => slice[offset] === byte)) {
        return zip[index + 8]! | (zip[index + 9]! << 8);
      }
    }
    return null;
  }

  it("reports a missing model instead of dropping the reference", async () => {
    const packed = await packCabinetArchive({ id: "p", objects: [{ extensions: { assetImport: { sourceUrl: "idb:missing" } } }] }, createMemoryAssetBlobStore());
    expect(packed.missing).toEqual(["idb:missing"]);
    const broken = zipSync({ "project.json": strToU8(JSON.stringify({ objects: [{ extensions: { assetImport: { sourceUrl: "models/missing.glb" } } }] })) });
    const opened = await unpackCabinetArchive(broken, createMemoryAssetBlobStore());
    expect(opened.missing).toEqual(["models/missing.glb"]);
  });

  it("still opens an older JSON project file", async () => {
    const store = createMemoryAssetBlobStore();
    const parsed = await parseProjectFileText(JSON.stringify({ id: "legacy", schemaVersion: 2, name: "Old" }), store);
    expect(parsed).toMatchObject({ id: "legacy", schemaVersion: 2 });
  });
});
