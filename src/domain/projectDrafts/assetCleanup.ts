import { documentsInUse } from "./inUseDocuments";
import { thumbnailKeepValues } from "./projectThumbnail";
import type { ProjectDraft } from "./types";

type StoredDocument = { document: unknown };

/**
 * Skip pruning when the snapshot list failed to load, or blobs that only a snapshot
 * references would be deleted. Thumbnail blobs count as in use.
 */
export async function pruneIfSnapshotsLoaded(options: {
  listSnapshots: () => Promise<readonly StoredDocument[]>;
  listDrafts: () => Promise<readonly ProjectDraft[]>;
  current: unknown;
  thumbnailRefs: readonly (string | null | undefined)[];
  prune: (documents: readonly unknown[]) => Promise<unknown>;
}): Promise<boolean> {
  let snapshots: readonly StoredDocument[];
  try {
    snapshots = await options.listSnapshots();
  } catch {
    return false;
  }
  const drafts = await options.listDrafts();
  await options.prune([
    ...documentsInUse(options.current, drafts, snapshots),
    ...thumbnailKeepValues(options.thumbnailRefs),
  ]);
  return true;
}
