export const SNAPSHOT_LIMIT = 20;
export const SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000;

export type SnapshotReason = "interval" | "room-closed" | "first-cabinet" | "render" | "before-restore";

export type ProjectSnapshot = {
  id: string;
  projectId: string;
  document: unknown;
  dwgPreviews: Record<string, unknown>;
  createdAt: string;
  reason: SnapshotReason;
  schemaVersion: number;
};

export type SnapshotStore = {
  list: () => Promise<ProjectSnapshot[]>;
  put: (snapshot: ProjectSnapshot) => Promise<void>;
  delete: (id: string) => Promise<void>;
};

export function createMemorySnapshotStore(): SnapshotStore & { size: () => number } {
  const snapshots = new Map<string, ProjectSnapshot>();
  return {
    list: async () => Array.from(snapshots.values()),
    put: async (snapshot) => { snapshots.set(snapshot.id, snapshot); },
    delete: async (id) => { snapshots.delete(id); },
    size: () => snapshots.size,
  };
}
