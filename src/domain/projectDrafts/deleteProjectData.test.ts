import { describe, expect, it } from "vitest";
import { createMemoryAssetBlobStore, storeAssetBlob, storedAssetKey } from "../livingRoom/storedAssets";
import { createMemorySnapshotStore } from "../projectSnapshots/types";
import { buildSnapshot } from "../projectSnapshots/history";
import { createMemoryDraftStore } from "./types";
import { deleteProjectData } from "./deleteProjectData";
import { storeProjectThumbnail, projectThumbnailStorageKey } from "./projectThumbnail";

describe("delete project data", () => {
  it("deletes the draft, snapshots and thumbnail, but leaves model blobs for the grace-period prune", async () => {
    const blobs = createMemoryAssetBlobStore(() => 0);
    const model = await storeAssetBlob(blobs, new Blob(["sofa"]));
    await storeProjectThumbnail(blobs, "gone", new Blob(["thumb"]));
    const drafts = createMemoryDraftStore();
    await drafts.put({
      id: "gone", document: { objects: [{ extensions: { assetImport: { sourceUrl: model } } }] },
      dwgPreviews: {}, updatedAt: "2026-09-29T00:00:00.000Z", schemaVersion: 2, lastFileSaveAt: null,
    });
    const snapshots = createMemorySnapshotStore();
    const snap = buildSnapshot({ id: "gone", objects: [{ extensions: { assetImport: { sourceUrl: model } } }] }, "interval", "2026-09-29T01:00:00.000Z");
    await snapshots.put(snap!);

    await deleteProjectData({ projectId: "gone", drafts, snapshots, blobs });

    expect(await drafts.get("gone")).toBeNull();
    expect(await snapshots.list()).toEqual([]);
    expect(await blobs.get(projectThumbnailStorageKey("gone"))).toBeNull();
    // Content-hashed model bytes may be shared with undo history or another tab.
    expect(await blobs.get(storedAssetKey(model))).not.toBeNull();
  });
});
