import type { ProjectSnapshot, SnapshotStore } from "../domain/projectSnapshots/types";
import { runStore, SNAPSHOT_STORE } from "./assetDatabase";

function asSnapshot(value: unknown): ProjectSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const snapshot = value as Partial<ProjectSnapshot>;
  if (typeof snapshot.id !== "string" || typeof snapshot.projectId !== "string" || typeof snapshot.createdAt !== "string") return null;
  return {
    id: snapshot.id,
    projectId: snapshot.projectId,
    document: snapshot.document ?? null,
    dwgPreviews: snapshot.dwgPreviews && typeof snapshot.dwgPreviews === "object" ? snapshot.dwgPreviews : {},
    createdAt: snapshot.createdAt,
    reason: snapshot.reason ?? "interval",
    schemaVersion: typeof snapshot.schemaVersion === "number" ? snapshot.schemaVersion : 2,
  };
}

export const indexedDbSnapshotStore: SnapshotStore = {
  list: async () => {
    const snapshots: ProjectSnapshot[] = [];
    await runStore(SNAPSHOT_STORE, "readonly", (store) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        const snapshot = asSnapshot(cursor.value);
        if (snapshot) snapshots.push(snapshot);
        cursor.continue();
      };
      return request;
    });
    return snapshots;
  },
  put: async (snapshot) => {
    await runStore(SNAPSHOT_STORE, "readwrite", (store) => store.put(snapshot, snapshot.id));
  },
  delete: async (id) => {
    await runStore(SNAPSHOT_STORE, "readwrite", (store) => store.delete(id));
  },
};
