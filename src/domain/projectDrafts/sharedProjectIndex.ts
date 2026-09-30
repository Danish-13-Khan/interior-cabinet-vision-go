import { PROJECT_BROWSER_STORAGE_KEY } from "../projectBrowserStorage";
import { readStoredBrowserList, writeProjectIndex } from "./projectIndex";
import type { ProjectIndexEntry } from "./types";

function timeOf(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function prefer(candidate: ProjectIndexEntry, previous: ProjectIndexEntry | undefined, sameTimeWins: boolean): boolean {
  if (!previous) return true;
  const next = timeOf(candidate.updatedAt);
  const prior = timeOf(previous.updatedAt);
  return sameTimeWins ? next >= prior : next > prior;
}

/** Union stored, unreadable, and visible entries. A stale in-memory list must not drop another tab's projects. */
export function mergeSharedProjectIndex(input: {
  stored: readonly ProjectIndexEntry[];
  retained: readonly ProjectIndexEntry[];
  visible: readonly ProjectIndexEntry[];
  deletedIds?: ReadonlySet<string>;
}): ProjectIndexEntry[] {
  const deleted = input.deletedIds ?? new Set<string>();
  const byId = new Map<string, ProjectIndexEntry>();
  const take = (entry: ProjectIndexEntry, sameTimeWins: boolean) => {
    if (deleted.has(entry.id)) return;
    const previous = byId.get(entry.id);
    if (!prefer(entry, previous, sameTimeWins)) return;
    byId.set(entry.id, {
      id: entry.id,
      name: entry.name || previous?.name || "Project",
      updatedAt: entry.updatedAt,
      thumbnailKey: entry.thumbnailKey ?? previous?.thumbnailKey ?? null,
    });
  };
  for (const entry of input.stored) take(entry, false);
  for (const entry of input.retained) take(entry, true);
  for (const entry of input.visible) take(entry, true);
  return [...byId.values()];
}

/** Failed startup must not replace the saved index. Legacy lists stay until migration finishes. */
export function persistSharedProjectIndex(
  storage: Pick<Storage, "getItem" | "setItem">,
  visible: readonly ProjectIndexEntry[],
  deletedIds: ReadonlySet<string>,
  loadSucceeded: boolean,
): "saved" | "skipped" {
  if (!loadSucceeded) return "skipped";
  const stored = readStoredBrowserList(storage.getItem(PROJECT_BROWSER_STORAGE_KEY));
  if (stored.legacy) return "skipped";
  writeProjectIndex(mergeSharedProjectIndex({
    stored: stored.index,
    retained: [],
    visible,
    deletedIds,
  }), storage);
  return "saved";
}
