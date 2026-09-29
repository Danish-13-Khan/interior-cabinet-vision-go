import { useEffect, useRef } from "react";
import { documentsInUse } from "../domain/projectDrafts/inUseDocuments";
import { migrateBrowserDrafts } from "../domain/projectDrafts/migrateBrowserDrafts";
import { pruneStoredAssets } from "../domain/livingRoom/storedAssets";
import { indexedDbAssetBlobStore } from "../platform/assetBlobStore";
import { indexedDbDraftStore } from "../platform/indexedDbDraftStore";

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
          await pruneStoredAssets(indexedDbAssetBlobStore, documentsInUse(currentRef.current, drafts));
        } catch {
          /* storage unavailable */
        }
      })();
    }, CLEANUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);
}
