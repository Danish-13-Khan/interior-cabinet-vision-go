/** Binary storage for imported model files; localStorage (~5 MB) cannot hold GLBs. */
export type AssetBlobStore = {
  get: (key: string) => Promise<Blob | null>;
  /** Writing an existing key refreshes its `storedAt`. */
  put: (key: string, blob: Blob) => Promise<void>;
};

export type StoredAssetEntry = { key: string; storedAt: number };

export type PrunableAssetBlobStore = AssetBlobStore & {
  list: () => Promise<StoredAssetEntry[]>;
  delete: (key: string) => Promise<void>;
};

export function createMemoryAssetBlobStore(now: () => number = Date.now): PrunableAssetBlobStore & { size: () => number } {
  const blobs = new Map<string, { blob: Blob; storedAt: number }>();
  return {
    get: async (key) => blobs.get(key)?.blob ?? null,
    put: async (key, blob) => { blobs.set(key, { blob, storedAt: now() }); },
    list: async () => Array.from(blobs, ([key, { storedAt }]) => ({ key, storedAt })),
    delete: async (key) => { blobs.delete(key); },
    size: () => blobs.size,
  };
}

export const STORED_ASSET_PREFIX = "idb:";

export function isStoredAssetRef(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(STORED_ASSET_PREFIX);
}

export function storedAssetRef(key: string): string {
  return `${STORED_ASSET_PREFIX}${key}`;
}

export function storedAssetKey(ref: string): string {
  return ref.slice(STORED_ASSET_PREFIX.length);
}

async function contentKey(blob: Blob): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return `blob-${blob.size}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const digest = new Uint8Array(await subtle.digest("SHA-256", await blob.arrayBuffer()));
  return `sha256-${Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

/** Store bytes under a content hash (identical files share one entry) and return an `idb:` reference. */
export async function storeAssetBlob(store: AssetBlobStore, blob: Blob): Promise<string> {
  const key = await contentKey(blob);
  await store.put(key, blob);
  return storedAssetRef(key);
}
