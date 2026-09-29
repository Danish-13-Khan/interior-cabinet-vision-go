import {
  isStoredAssetRef,
  storedAssetKey,
  type AssetBlobStore,
} from "../domain/livingRoom/storedAssets";
import { indexedDbAssetBlobStore } from "./assetBlobStore";

type Entry = {
  promise: Promise<string>;
  url?: string;
  error?: Error;
  /**
   * Read by the 3D view. drei caches parsed GLBs by URL, so revoking and recreating the URL would
   * re-parse the model and leave the old copy in its cache; pinned URLs live for the session instead.
   */
  pinned: boolean;
  holders: number;
  releaseTimer?: ReturnType<typeof setTimeout>;
};

/** Unheld preview URLs (and failed lookups) survive this long so remounting components can reuse them. */
const RELEASE_DELAY_MS = 60_000;

const entries = new Map<string, Entry>();

function scheduleRelease(ref: string, entry: Entry) {
  clearTimeout(entry.releaseTimer);
  entry.releaseTimer = setTimeout(() => {
    if (entries.get(ref) !== entry || entry.holders > 0 || (entry.pinned && !entry.error)) return;
    entries.delete(ref);
    if (entry.url) URL.revokeObjectURL(entry.url);
  }, RELEASE_DELAY_MS);
}

function entryFor(ref: string, store: AssetBlobStore): Entry {
  const existing = entries.get(ref);
  if (existing) return existing;
  const entry: Entry = {
    pinned: false,
    holders: 0,
    promise: store.get(storedAssetKey(ref)).then((blob) => {
      if (!blob) throw new Error("Imported model file is missing from this browser's storage.");
      entry.url = URL.createObjectURL(blob);
      return entry.url;
    }),
  };
  entry.promise.catch((error: unknown) => {
    entry.error = error instanceof Error ? error : new Error(String(error));
    scheduleRelease(ref, entry);
  });
  entries.set(ref, entry);
  scheduleRelease(ref, entry);
  return entry;
}

/** Keep preview blob URLs alive while a mounted component uses them; returns the release callback. */
export function retainStoredAssetUrls(urls: readonly (string | undefined)[]): () => void {
  const held: Array<[string, Entry]> = [];
  for (const url of new Set(urls)) {
    const entry = isStoredAssetRef(url) ? entries.get(url) : undefined;
    if (!url || !entry) continue;
    entry.holders += 1;
    held.push([url, entry]);
  }
  return () => {
    for (const [ref, entry] of held) {
      entry.holders -= 1;
      if (entry.holders <= 0) scheduleRelease(ref, entry);
    }
  };
}

/** Plain URLs pass through; `idb:` references become cached blob URLs (released when unused). */
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

/** Suspense read for the 3D view: pins the URL, throws the pending promise while loading, and the error when missing. */
export function readStoredAssetUrl(url: string, store: AssetBlobStore = indexedDbAssetBlobStore): string {
  if (!isStoredAssetRef(url)) return url;
  const entry = entryFor(url, store);
  entry.pinned = true;
  if (entry.url) return entry.url;
  if (entry.error) throw entry.error;
  throw entry.promise;
}
