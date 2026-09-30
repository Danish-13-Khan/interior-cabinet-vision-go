import { useEffect, useRef } from "react";
import { pruneIfSnapshotsLoaded } from "../domain/projectDrafts/assetCleanup";
import { migrateBrowserDrafts } from "../domain/projectDrafts/migrateBrowserDrafts";
import { readStoredBrowserList } from "../domain/projectDrafts/projectIndex";
import { PROJECT_BROWSER_STORAGE_KEY } from "../domain/projectBrowserStorage";
import { projectThumbnailStorageKey } from "../domain/projectDrafts/projectThumbnail";
import { storedAssetRef, pruneStoredAssets } from "../domain/livingRoom/storedAssets";
import { indexedDbAssetBlobStore } from "../platform/assetBlobStore";
import { indexedDbDraftStore } from "../platform/indexedDbDraftStore";
import { indexedDbSnapshotStore } from "../platform/indexedDbSnapshotStore";

const CLEANUP_DELAY_MS = 5000;

/**
 * Once per session, remove stored model files that no draft or the open project references.
 * Migration runs first so a project that only lives in the old localStorage list is not pruned.
 */
export function useStoredAssetCleanup(currentProject: unknown) {
  const currentRef = useRef(currentProject);
  currentRef.current = currentProject;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await migrateBrowserDrafts({
            storage: localStorage,
            blobs: indexedDbAssetBlobStore,
            drafts: indexedDbDraftStore,
          });
          const drafts = await indexedDbDraftStore.list();
          const index = readStoredBrowserList(localStorage.getItem(PROJECT_BROWSER_STORAGE_KEY)).index;
          const thumbnailRefs = [
            ...index.map((entry) => entry.thumbnailKey),
            ...drafts.map((draft) => storedAssetRef(projectThumbnailStorageKey(draft.id))),
            ...index.map((entry) => storedAssetRef(projectThumbnailStorageKey(entry.id))),
          ];
          await pruneIfSnapshotsLoaded({
            listSnapshots: () => indexedDbSnapshotStore.list(),
            listDrafts: async () => drafts,
            current: currentRef.current,
            thumbnailRefs,
            prune: (documents) => pruneStoredAssets(indexedDbAssetBlobStore, documents),
          });
        } catch {
          /* storage unavailable */
        }
      })();
    }, CLEANUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);
}
