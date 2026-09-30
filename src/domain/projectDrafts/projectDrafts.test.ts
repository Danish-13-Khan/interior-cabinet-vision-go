import { describe, expect, it } from "vitest";
import { dwgPreviewDataUrl } from "../livingRoom/dwgPreviewSvg";
import { createMemoryAssetBlobStore, pruneStoredAssets, STORED_ASSET_PRUNE_GRACE_MS, storeAssetBlob } from "../livingRoom/storedAssets";
import { PROJECT_BROWSER_STORAGE_KEY } from "../projectBrowserStorage";
import { commitDraftSave } from "./commitDraft";
import { rebuildDwgDataUrls, splitDwgPreviews } from "./dwgDraftSplit";
import { documentsInUse } from "./inUseDocuments";
import { migrateBrowserDrafts } from "./migrateBrowserDrafts";
import { clearDraftPending, isDraftPending, markDraftPending, shouldClearPending } from "./pendingMarker";
import { createMemoryDraftStore } from "./types";

const preview = {
  bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
  layers: [{ name: "Walls", paths: [{ d: "M0 0 L10 10", matrix: [1, 0, 0, 1, 0, 0] }] }],
};

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial) values.set(PROJECT_BROWSER_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe("draft autosave migration", () => {
  it("rebuilds a DWG data URL from the preview stored on the draft", () => {
    const dataUrl = dwgPreviewDataUrl(preview, []);
    const document = { extensions: { planUnderlay: { id: "plan-1", fileName: "room.dwg", dataUrl, dwg: { preview, hiddenLayers: [] } } } };
    const split = splitDwgPreviews(document);
    const stored = split.document as { extensions: { planUnderlay: { dataUrl?: string; dwg: { preview?: unknown } } } };
    expect(stored.extensions.planUnderlay.dataUrl).toBeUndefined();
    expect(stored.extensions.planUnderlay.dwg.preview).toBeUndefined();
    expect(split.dwgPreviews["plan-1"]).toEqual(preview);
    const rebuilt = rebuildDwgDataUrls(split.document, split.dwgPreviews) as typeof document;
    expect(rebuilt.extensions.planUnderlay.dataUrl).toBe(dataUrl);
  });

  it("keeps blobs referenced only by a draft after the localStorage list becomes an index", async () => {
    const blobs = createMemoryAssetBlobStore(() => 0);
    const ref = await storeAssetBlob(blobs, new Blob(["sofa"]));
    const drafts = createMemoryDraftStore();
    const legacy = [{
      id: "saved-1",
      name: "Room",
      thumbnail: "",
      updatedAt: "2026-09-01T00:00:00.000Z",
      project: { interiorDocument: { id: "proj-1", schemaVersion: 2, objects: [{ extensions: { assetImport: { sourceUrl: ref } } }] } },
      room: { dimensions: { widthMm: 1, depthMm: 1, heightMm: 1, wallThicknessMm: 1, showBackWall: true, showLeftWall: true, showRightWall: true }, doors: [], windows: [] },
    }];
    const storage = memoryStorage(JSON.stringify(legacy));
    await migrateBrowserDrafts({ storage, blobs, drafts });
    const indexRaw = storage.getItem(PROJECT_BROWSER_STORAGE_KEY) ?? "";
    expect(indexRaw).not.toContain("idb:");
    expect(indexRaw).not.toContain("\"project\"");
    const kept = await pruneStoredAssets(blobs, documentsInUse(null, await drafts.list()), { now: STORED_ASSET_PRUNE_GRACE_MS + 1 });
    expect(kept).toBe(0);
    expect(await blobs.get(ref.slice("idb:".length))).not.toBeNull();
    const removed = await pruneStoredAssets(blobs, [JSON.parse(indexRaw)], { now: STORED_ASSET_PRUNE_GRACE_MS + 1 });
    expect(removed).toBe(1);
  });

  it("sets the pending marker before a save and clears it only when that save commits", async () => {
    const storage = memoryStorage();
    markDraftPending(storage, "proj-1");
    expect(isDraftPending(storage, "proj-1")).toBe(true);
    const drafts = createMemoryDraftStore();
    const draft = { id: "proj-1", document: {}, dwgPreviews: {}, updatedAt: "2026-09-29T00:00:00.000Z", schemaVersion: 2, lastFileSaveAt: null };
    await commitDraftSave(draft, drafts, storage, 1, 1);
    expect(isDraftPending(storage, "proj-1")).toBe(false);
    markDraftPending(storage, "proj-1");
    await commitDraftSave(draft, drafts, storage, 1, 2);
    expect(shouldClearPending(1, 2)).toBe(false);
    expect(isDraftPending(storage, "proj-1")).toBe(true);
    clearDraftPending(storage, "proj-1");
  });
});

describe("draft save races", () => {
  it("keeps lastFileSaveAt when autosave commits and does not clear a newer edit", async () => {
    const storage = memoryStorage();
    const drafts = createMemoryDraftStore();
    const draft = { id: "proj-1", document: {}, dwgPreviews: {}, updatedAt: "2026-09-29T00:00:00.000Z", schemaVersion: 2, lastFileSaveAt: "2026-09-01T00:00:00.000Z" };
    await drafts.put(draft);
    await commitDraftSave({ ...draft, lastFileSaveAt: null, updatedAt: "2026-09-02T00:00:00.000Z" }, drafts, storage, 1, 1);
    expect((await drafts.get("proj-1"))?.lastFileSaveAt).toBe("2026-09-01T00:00:00.000Z");
    markDraftPending(storage, "proj-1");
    let latest = 1;
    await commitDraftSave(draft, {
      ...drafts,
      put: async (next) => { latest = 2; await drafts.put(next); },
    }, storage, 1, () => latest);
    expect(isDraftPending(storage, "proj-1")).toBe(true);
  });
});

