import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { hasEmbeddedAssetData, stashEmbeddedAssets } from "../domain/livingRoom/storedAssets";
import {
  persistSavedProjects,
  PROJECT_BROWSER_QUOTA_MESSAGE,
  type SavedProjectBrowserEntry,
} from "../domain/projectBrowserStorage";
import { indexedDbAssetBlobStore } from "../platform/assetBlobStore";
import { setStorageWarning } from "./useStorageWarnings";

const AUTOSAVE_FAILED_MESSAGE = "Browser autosave failed; save the project to a file instead.";

/**
 * Writes the saved-project list to localStorage outside of state updaters.
 * Entries still carrying model bytes inline (saved before IndexedDB storage) are moved to IndexedDB first.
 */
export function useSavedProjectsPersistence(
  savedProjects: SavedProjectBrowserEntry[],
  setSavedProjects: Dispatch<SetStateAction<SavedProjectBrowserEntry[]>>,
  onStatus: (status: string) => void,
) {
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  const persistedRef = useRef(savedProjects);
  const failedRef = useRef(false);

  useEffect(() => {
    const persist = (entries: SavedProjectBrowserEntry[]) => {
      persistedRef.current = entries;
      const result = persistSavedProjects(entries);
      const failed = result === "quota-exceeded" || result === "failed";
      const message = result === "quota-exceeded" ? PROJECT_BROWSER_QUOTA_MESSAGE : AUTOSAVE_FAILED_MESSAGE;
      if (failed && !failedRef.current) onStatusRef.current(message);
      setStorageWarning("browser-autosave", failed ? message : null);
      failedRef.current = failed;
    };

    if (!hasEmbeddedAssetData(savedProjects)) {
      if (savedProjects !== persistedRef.current) persist(savedProjects);
      return;
    }
    let live = true;
    void stashEmbeddedAssets(savedProjects, indexedDbAssetBlobStore).then((migrated) => {
      if (!live) return;
      if (hasEmbeddedAssetData(migrated)) persist(migrated);
      else setSavedProjects(migrated);
    });
    return () => { live = false; };
  }, [savedProjects, setSavedProjects]);

  return { failedRef };
}
