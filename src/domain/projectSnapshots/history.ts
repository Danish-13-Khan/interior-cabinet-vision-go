import { rebuildDwgDataUrls, splitDwgPreviews } from "../projectDrafts/dwgDraftSplit";
import { migrateInteriorProjectDocument } from "../interiorProject/migrations";
import { SNAPSHOT_LIMIT, type ProjectSnapshot, type SnapshotReason, type SnapshotStore } from "./types";

/** History is per project. Missing id must not list every project's snapshots. */
export function snapshotsForProject(all: readonly ProjectSnapshot[], projectId: string | null | undefined): ProjectSnapshot[] {
  if (!projectId) return [];
  return all.filter((snapshot) => snapshot.projectId === projectId).sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1));
}

export function snapshotId(projectId: string, createdAt: string): string {
  return `${projectId}:${createdAt}`;
}

export function withSnapshot(existing: readonly ProjectSnapshot[], next: ProjectSnapshot, limit = SNAPSHOT_LIMIT) {
  const others = existing.filter((snapshot) => snapshot.projectId !== next.projectId);
  const ranked = [next, ...existing.filter((snapshot) => snapshot.projectId === next.projectId && snapshot.id !== next.id)]
    .sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1));
  return { kept: [...others, ...ranked.slice(0, limit)], droppedIds: ranked.slice(limit).map((snapshot) => snapshot.id) };
}

export function buildSnapshot(document: unknown, reason: SnapshotReason, createdAt: string): ProjectSnapshot | null {
  if (!document || typeof document !== "object") return null;
  const record = document as { id?: unknown; schemaVersion?: unknown };
  if (typeof record.id !== "string" || !record.id) return null;
  const split = splitDwgPreviews(document);
  return {
    id: snapshotId(record.id, createdAt),
    projectId: record.id,
    document: split.document,
    dwgPreviews: split.dwgPreviews,
    createdAt,
    reason,
    schemaVersion: typeof record.schemaVersion === "number" ? record.schemaVersion : 2,
  };
}

/** Restore runs the same schema migrations as opening a project file. */
export function restoreSnapshot(snapshot: ProjectSnapshot): unknown {
  const rebuilt = rebuildDwgDataUrls(snapshot.document, snapshot.dwgPreviews);
  return migrateInteriorProjectDocument(rebuilt).document;
}

export async function recordSnapshot(store: SnapshotStore, snapshot: ProjectSnapshot): Promise<void> {
  const { droppedIds } = withSnapshot(await store.list(), snapshot);
  await store.put(snapshot);
  await Promise.all(droppedIds.map((id) => store.delete(id)));
}
