import {
  isStoredAssetRef,
  storedAssetKey,
  type AssetBlobStore,
} from "../domain/livingRoom/storedAssets";
import { indexedDbAssetBlobStore } from "./assetBlobStore";

type Entry = { promise: Promise<string>; url?: string; error?: Error };

const entries = new Map<string, Entry>();

function entryFor(ref: string, store: AssetBlobStore): Entry {
  const existing = entries.get(ref);
  if (existing) return existing;
  const entry: Entry = {
    promise: store.get(storedAssetKey(ref)).then((blob) => {
      if (!blob) throw new Error("Imported model file is missing from this browser's storage.");
      entry.url = URL.createObjectURL(blob);
      return entry.url;
    }),
  };
  entry.promise.catch((error: unknown) => {
    entry.error = error instanceof Error ? error : new Error(String(error));
  });
  entries.set(ref, entry);
  return entry;
}

/** Plain URLs pass through; `idb:` references become cached blob URLs. */
export function resolveStoredAssetUrl(url: string, store: AssetBlobStore = indexedDbAssetBlobStore): Promise<string> {
  return isStoredAssetRef(url) ? entryFor(url, store).promise : Promise.resolve(url);
}

/** Suspense read of every texture URL; returns the input object when nothing needs resolving. */
export function readStoredTextureUrls<T extends Partial<Record<string, string>>>(textures: T | undefined): T | undefined {
  if (!textures || !Object.values(textures).some(isStoredAssetRef)) return textures;
  const resolved: Partial<Record<string, string>> = {};
  for (const [slot, url] of Object.entries(textures)) resolved[slot] = url ? readStoredAssetUrl(url) : url;
  return resolved as T;
}

/** Suspense read: throws the pending promise while loading and the error when the blob is missing. */
export function readStoredAssetUrl(url: string, store: AssetBlobStore = indexedDbAssetBlobStore): string {
  if (!isStoredAssetRef(url)) return url;
  const entry = entryFor(url, store);
  if (entry.url) return entry.url;
  if (entry.error) throw entry.error;
  throw entry.promise;
}
