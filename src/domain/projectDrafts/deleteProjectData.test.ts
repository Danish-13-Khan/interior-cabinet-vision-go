import { describe, expect, it } from "vitest";
import { createMemoryAssetBlobStore, storeAssetBlob, storedAssetKey } from "../livingRoom/storedAssets";
import { createMemorySnapshotStore } from "../projectSnapshots/types";
import { buildSnapshot } from "../projectSnapshots/history";
import { createMemoryDraftStore } from "./types";
import { deleteProjectData } from "./deleteProjectData";

describe("delete project data", () => {
  it("deletes that project's snapshots and blobs, and leaves another project's blob", async () => {
    const blobs = createMemoryAssetBlobStore(() => 0);
    const own = await storeAssetBlob(blobs, new Blob(["sofa"]));
    const shared = await storeAssetBlob(blobs, new Blob(["shared"]));
    const drafts = createMemoryDraftStore();
    await drafts.put({
      id: "gone", document: { objects: [{ extensions: { assetImport: { sourceUrl: own } } }] },
      dwgPreviews: {}, updatedAt: "2026-09-29T00:00:00.000Z", schemaVersion: 2, lastFileSaveAt: null,
    });
    await drafts.put({
      id: "kept", document: { objects: [{ extensions: { assetImport: { sourceUrl: shared } } }] },
      dwgPreviews: {}, updatedAt: "2026-09-29T00:00:00.000Z", schemaVersion: 2, lastFileSaveAt: null,
    });
    const snapshots = createMemorySnapshotStore();
    const snap = buildSnapshot({ id: "gone", objects: [{ extensions: { assetImport: { sourceUrl: own } } }] }, "interval", "2026-09-29T01:00:00.000Z");
    await snapshots.put(snap!);
    await deleteProjectData({ projectId: "gone", drafts, snapshots, blobs, current: null });
    expect(await drafts.get("gone")).toBeNull();
    expect(await snapshots.list()).toEqual([]);
    expect(await blobs.get(storedAssetKey(own))).toBeNull();
    expect(await blobs.get(storedAssetKey(shared))).not.toBeNull();
  });
});
