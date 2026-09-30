import { PROJECT_BROWSER_STORAGE_KEY } from "../projectBrowserStorage";
import { readStoredBrowserList, writeProjectIndex } from "./projectIndex";
import type { ProjectIndexEntry } from "./types";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** Deleted project ids and when, shared by every tab through localStorage. */
export const DELETED_PROJECTS_KEY = "cabinet-deleted-projects";
const TOMBSTONE_LIMIT = 200;

function timeOf(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function readProjectTombstones(storage: Pick<Storage, "getItem">): Record<string, string> {
  try {
    const parsed = JSON.parse(storage.getItem(DELETED_PROJECTS_KEY) ?? "{}") as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const tombstones: Record<string, string> = {};
    for (const [id, at] of Object.entries(parsed)) if (typeof at === "string") tombstones[id] = at;
    return tombstones;
  } catch {
    return {};
  }
}

/** Remember a delete so another tab's stale list cannot write the project back. */
export function recordProjectDeletion(storage: StorageLike, projectId: string, deletedAt = new Date().toISOString()): void {
  const tombstones = { ...readProjectTombstones(storage), [projectId]: deletedAt };
  const newest = Object.entries(tombstones).sort((a, b) => timeOf(b[1]) - timeOf(a[1])).slice(0, TOMBSTONE_LIMIT);
  try {
    storage.setItem(DELETED_PROJECTS_KEY, JSON.stringify(Object.fromEntries(newest)));
  } catch {
    /* the delete itself already happened in this tab */
  }
}

/**
 * A tombstoned entry is dropped unless it was edited after the delete: a tab still editing
 * the project keeps it (its newer work wins), while stale copies of it stay deleted.
 */
function isDeleted(entry: ProjectIndexEntry, tombstones: Readonly<Record<string, string>>): boolean {
  const deletedAt = tombstones[entry.id];
  return deletedAt !== undefined && timeOf(entry.updatedAt) <= timeOf(deletedAt);
}

/** Union stored and visible entries. A stale in-memory list must not drop another tab's projects. */
export function mergeSharedProjectIndex(input: {
  stored: readonly ProjectIndexEntry[];
  visible: readonly ProjectIndexEntry[];
  tombstones?: Readonly<Record<string, string>>;
}): ProjectIndexEntry[] {
  const tombstones = input.tombstones ?? {};
  const byId = new Map<string, ProjectIndexEntry>();
  const take = (entry: ProjectIndexEntry, sameTimeWins: boolean) => {
    if (isDeleted(entry, tombstones)) return;
    const previous = byId.get(entry.id);
    if (previous) {
      const next = timeOf(entry.updatedAt);
      const prior = timeOf(previous.updatedAt);
      if (sameTimeWins ? next < prior : next <= prior) return;
    }
    byId.set(entry.id, {
      id: entry.id,
      name: entry.name || previous?.name || "Project",
      updatedAt: entry.updatedAt,
      thumbnailKey: entry.thumbnailKey ?? previous?.thumbnailKey ?? null,
    });
  };
  for (const entry of input.stored) take(entry, false);
  for (const entry of input.visible) take(entry, true);
  return [...byId.values()];
}

/** Failed startup must not replace the saved index. Legacy lists stay until migration finishes. */
export function persistSharedProjectIndex(
  storage: StorageLike,
  visible: readonly ProjectIndexEntry[],
  loadSucceeded: boolean,
): "saved" | "skipped" {
  if (!loadSucceeded) return "skipped";
  const stored = readStoredBrowserList(storage.getItem(PROJECT_BROWSER_STORAGE_KEY));
  if (stored.legacy) return "skipped";
  writeProjectIndex(mergeSharedProjectIndex({
    stored: stored.index,
    visible,
    tombstones: readProjectTombstones(storage),
  }), storage);
  return "saved";
}
