import { collectStoredAssetKeys, storedAssetRef, type PrunableAssetBlobStore } from "../livingRoom/storedAssets";
import { projectThumbnailStorageKey } from "./projectThumbnail";
import { documentsInUse } from "./inUseDocuments";
import type { SnapshotStore } from "../projectSnapshots/types";
import type { DraftStore } from "./types";

/** Deleting a project removes its draft, its snapshots, and blobs nothing else still uses. */
export async function deleteProjectData(options: {
  projectId: string;
  drafts: DraftStore;
  snapshots: SnapshotStore;
  blobs: PrunableAssetBlobStore;
  current: unknown;
}): Promise<void> {
  const [drafts, snapshots] = await Promise.all([options.drafts.list(), options.snapshots.list()]);
  const removedDrafts = drafts.filter((draft) => draft.id === options.projectId);
  const removedSnapshots = snapshots.filter((snapshot) => snapshot.projectId === options.projectId);
  const kept = documentsInUse(
    options.current,
    drafts.filter((draft) => draft.id !== options.projectId),
    snapshots.filter((snapshot) => snapshot.projectId !== options.projectId),
  );
  const keepKeys = await collectStoredAssetKeys(kept);
  const ownedKeys = await collectStoredAssetKeys([
    ...removedDrafts.map((draft) => draft.document),
    ...removedSnapshots.map((snapshot) => snapshot.document),
    { extensions: { assetImport: { sourceUrl: storedAssetRef(projectThumbnailStorageKey(options.projectId)) } } },
  ]);
  await options.drafts.delete(options.projectId);
  await Promise.all(removedSnapshots.map((snapshot) => options.snapshots.delete(snapshot.id)));
  for (const key of ownedKeys) {
    if (!keepKeys.has(key)) await options.blobs.delete(key);
  }
}
