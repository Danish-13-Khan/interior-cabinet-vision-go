import type { PrunableAssetBlobStore } from "../livingRoom/storedAssets";
import { projectThumbnailStorageKey } from "./projectThumbnail";
import type { SnapshotStore } from "../projectSnapshots/types";
import type { DraftStore } from "./types";

/**
 * Deleting a project removes its draft, its snapshots, and its own thumbnail blob.
 *
 * Model and texture blobs are NOT deleted here. They are keyed by content hash and can be
 * shared with other projects, undo history, another tab's unsaved project, or an import in
 * progress, none of which this tab can see. Once nothing references them, the normal
 * grace-period prune (pruneStoredAssets) removes them.
 */
export async function deleteProjectData(options: {
  projectId: string;
  drafts: DraftStore;
  snapshots: SnapshotStore;
  blobs: PrunableAssetBlobStore;
}): Promise<void> {
  const snapshots = await options.snapshots.list();
  await options.drafts.delete(options.projectId);
  await Promise.all(
    snapshots
      .filter((snapshot) => snapshot.projectId === options.projectId)
      .map((snapshot) => options.snapshots.delete(snapshot.id)),
  );
  // The thumbnail key is per project, never shared, so it is safe to remove now.
  await options.blobs.delete(projectThumbnailStorageKey(options.projectId));
}
