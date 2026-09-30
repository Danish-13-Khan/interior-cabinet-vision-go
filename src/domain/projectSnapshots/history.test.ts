import { describe, expect, it } from "vitest";
import { createMemoryAssetBlobStore, storeAssetBlob } from "../livingRoom/storedAssets";
import { STORED_ASSET_PRUNE_GRACE_MS, pruneStoredAssets } from "../livingRoom/storedAssets";
import { documentsInUse } from "../projectDrafts/inUseDocuments";
import { INTERIOR_PROJECT_SCHEMA_VERSION } from "../interiorProject";
import { buildSnapshot, recordSnapshot, restoreSnapshot, snapshotsForProject, withSnapshot } from "./history";
import { versionRestorePlan } from "./versionRestore";
import { createMemorySnapshotStore, type ProjectSnapshot } from "./types";

function snapshot(projectId: string, createdAt: string, document: unknown = { id: projectId, schemaVersion: 2 }): ProjectSnapshot {
  return buildSnapshot({ ...(document as object), id: projectId }, "interval", createdAt)!;
}

describe("project snapshots", () => {
  it("keeps the last 20 and restores through older schema versions", async () => {
    const store = createMemorySnapshotStore();
    for (let index = 0; index < 22; index += 1) {
      await recordSnapshot(store, snapshot("proj", `2026-09-29T00:${String(index).padStart(2, "0")}:00.000Z`));
    }
    const kept = (await store.list()).filter((item) => item.projectId === "proj");
    expect(kept).toHaveLength(20);
    expect(kept.some((item) => item.createdAt.endsWith("00:00.000Z"))).toBe(false);
    const restoredV0 = restoreSnapshot(snapshot("old", "2026-09-29T01:00:00.000Z", { schemaVersion: 0, name: "Legacy" })) as { schemaVersion: number; name: string };
    const restoredV1 = restoreSnapshot(snapshot("mid", "2026-09-29T01:00:00.000Z", { schemaVersion: 1, walls: [] })) as { schemaVersion: number };
    expect(restoredV0.schemaVersion).toBe(INTERIOR_PROJECT_SCHEMA_VERSION);
    expect(restoredV0.name).toBe("Legacy");
    expect(restoredV1.schemaVersion).toBe(INTERIOR_PROJECT_SCHEMA_VERSION);
    expect(withSnapshot([], snapshot("proj", "2026-09-29T02:00:00.000Z")).droppedIds).toEqual([]);
  });

  it("prune keeps a blob that only a snapshot still references", async () => {
    const blobs = createMemoryAssetBlobStore(() => 0);
    const ref = await storeAssetBlob(blobs, new Blob(["chair"]));
    const snap = snapshot("proj", "2026-09-29T03:00:00.000Z", {
      schemaVersion: 2,
      objects: [{ extensions: { assetImport: { sourceUrl: ref } } }],
    });
    const removed = await pruneStoredAssets(blobs, documentsInUse(null, [], [snap]), { now: STORED_ASSET_PRUNE_GRACE_MS + 1 });
    expect(removed).toBe(0);
    expect(await blobs.get(ref.slice("idb:".length))).not.toBeNull();
  });
});

describe("version restore stays on the same project file", () => {
  it("lists only the open project's snapshots and never uses the literal version path", () => {
    const all = [snapshot("a", "2026-09-29T02:00:00.000Z"), snapshot("b", "2026-09-29T03:00:00.000Z")];
    expect(snapshotsForProject(all, "a").map((item) => item.projectId)).toEqual(["a"]);
    expect(snapshotsForProject(all, null)).toEqual([]);
    expect(versionRestorePlan({ currentPath: null, currentProjectId: "a", restoredProjectId: "a" })).toEqual({ path: null, rememberPath: null, markClean: false });
    expect(versionRestorePlan({ currentPath: "version", currentProjectId: "a", restoredProjectId: "a" }).path).toBeNull();
    expect(versionRestorePlan({ currentPath: "/tmp/a.cabinet", currentProjectId: "a", restoredProjectId: "b" })).toMatchObject({ path: null, markClean: false, rememberPath: null });
    expect(versionRestorePlan({ currentPath: "/tmp/a.cabinet", currentProjectId: "a", restoredProjectId: "a" }).path).toBe("/tmp/a.cabinet");
  });
});
