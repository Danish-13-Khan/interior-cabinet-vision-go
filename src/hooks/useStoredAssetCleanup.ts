import { useEffect, useRef } from "react";
import { pruneStoredAssets } from "../domain/livingRoom/storedAssets";
import { indexedDbAssetBlobStore } from "../platform/assetBlobStore";

const CLEANUP_DELAY_MS = 5000;

function localStorageDocuments(): unknown[] {
  const documents: unknown[] = [];
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      const raw = key ? window.localStorage.getItem(key) : null;
      if (!raw || !raw.includes("idb:")) continue;
      try { documents.push(JSON.parse(raw) as unknown); } catch { /* not JSON */ }
    }
  } catch {
    /* storage unavailable */
  }
  return documents;
}

/**
 * Once per session, remove stored model files that no saved project, recovery snapshot,
 * or the open project references (deleted objects, deleted projects, cancelled imports).
 */
export function useStoredAssetCleanup(currentProject: unknown) {
  const currentRef = useRef(currentProject);
  currentRef.current = currentProject;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void pruneStoredAssets(indexedDbAssetBlobStore, [currentRef.current, ...localStorageDocuments()])
        .catch(() => 0);
    }, CLEANUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);
}
