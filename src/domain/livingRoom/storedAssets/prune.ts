import { mapImportedAssetUrls } from "./fileAssets";
import { isStoredAssetRef, storedAssetKey, type PrunableAssetBlobStore } from "./refs";

/**
 * Files written this recently are kept even when unreferenced: in-flight imports, session restore, and
 * projects that live only as files on disk. Pruning those is safe (project files embed the bytes and
 * opening one stores them again, refreshing the timestamp); the window just avoids needless re-storing.
 */
export const STORED_ASSET_PRUNE_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

export async function collectStoredAssetKeys(values: readonly unknown[]): Promise<Set<string>> {
  const keys = new Set<string>();
  await mapImportedAssetUrls(values, async (url) => {
    if (isStoredAssetRef(url)) keys.add(storedAssetKey(url));
    return url;
  });
  return keys;
}

/** Delete stored model files that nothing in `referencedBy` points to any more. Returns how many were removed. */
export async function pruneStoredAssets(
  store: PrunableAssetBlobStore,
  referencedBy: readonly unknown[],
  options: { now?: number; graceMs?: number } = {},
): Promise<number> {
  const keep = await collectStoredAssetKeys(referencedBy);
  const cutoff = (options.now ?? Date.now()) - (options.graceMs ?? STORED_ASSET_PRUNE_GRACE_MS);
  const stale = (await store.list()).filter((entry) => !keep.has(entry.key) && entry.storedAt < cutoff);
  for (const entry of stale) await store.delete(entry.key);
  return stale.length;
}
