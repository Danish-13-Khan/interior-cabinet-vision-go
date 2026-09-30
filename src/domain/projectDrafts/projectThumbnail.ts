import { isStoredAssetRef, storedAssetRef, type AssetBlobStore } from "../livingRoom/storedAssets";

/** One blob per project. Later autosaves replace it instead of leaking a new blob. */
export function projectThumbnailStorageKey(projectId: string): string {
  return `thumbnail:${projectId}`;
}

export async function storeProjectThumbnail(store: AssetBlobStore, projectId: string, blob: Blob): Promise<string> {
  const key = projectThumbnailStorageKey(projectId);
  await store.put(key, blob);
  return storedAssetRef(key);
}

/** Shape prune already understands: imported-asset refs, including thumbnail blobs. */
export function thumbnailKeepValues(refs: readonly (string | null | undefined)[]): unknown[] {
  return refs.filter((ref): ref is string => isStoredAssetRef(ref)).map((sourceUrl) => ({
    extensions: { assetImport: { sourceUrl } },
  }));
}
