import type { CachedFileEntry, CachedManifestEntry } from "./catalogCacheEntries";
import { persistableFileEntry } from "./catalogCacheEntries";

export type CatalogMetadataSnapshot = {
  manifest: CachedManifestEntry | null;
  files: CachedFileEntry[];
};

/** Durable catalog metadata (manifest + fileId→contentHash). Blobs stay in CatalogBlobStore. */
export type CatalogMetadataStore = {
  load(): Promise<CatalogMetadataSnapshot>;
  save(snapshot: CatalogMetadataSnapshot): Promise<void>;
  clear(): Promise<void>;
};

/** In-memory metadata — durable only when the same store instance is reused. */
export class MemoryCatalogMetadataStore implements CatalogMetadataStore {
  private snapshot: CatalogMetadataSnapshot = { manifest: null, files: [] };

  async load(): Promise<CatalogMetadataSnapshot> {
    return {
      manifest: this.snapshot.manifest,
      files: this.snapshot.files.map((entry) => ({ ...entry })),
    };
  }

  async save(snapshot: CatalogMetadataSnapshot): Promise<void> {
    this.snapshot = {
      manifest: snapshot.manifest,
      files: snapshot.files.map((entry) => persistableFileEntry(entry)),
    };
  }

  async clear(): Promise<void> {
    this.snapshot = { manifest: null, files: [] };
  }
}

const META_CACHE = "catalog-meta-v1";
const MANIFEST_REQ = new Request("https://catalog.local/meta/manifest");
const FILES_REQ = new Request("https://catalog.local/meta/files");

/**
 * Cache API metadata store — survives reload with CacheApiCatalogBlobStore.
 * TODO(cdn): IndexedDB fallback for browsers without Cache API.
 */
export class CacheApiCatalogMetadataStore implements CatalogMetadataStore {
  constructor(private readonly cacheName = META_CACHE) {}

  private async cache(): Promise<Cache> {
    return caches.open(this.cacheName);
  }

  async load(): Promise<CatalogMetadataSnapshot> {
    const cache = await this.cache();
    const manifestRes = await cache.match(MANIFEST_REQ);
    const filesRes = await cache.match(FILES_REQ);
    const manifest = manifestRes
      ? ((await manifestRes.json()) as CachedManifestEntry)
      : null;
    const files = filesRes ? ((await filesRes.json()) as CachedFileEntry[]) : [];
    return { manifest, files: Array.isArray(files) ? files : [] };
  }

  async save(snapshot: CatalogMetadataSnapshot): Promise<void> {
    const cache = await this.cache();
    const files = snapshot.files.map(persistableFileEntry);
    if (snapshot.manifest) {
      await cache.put(
        MANIFEST_REQ,
        new Response(JSON.stringify(snapshot.manifest), {
          headers: { "Content-Type": "application/json" },
        }),
      );
    } else {
      await cache.delete(MANIFEST_REQ);
    }
    await cache.put(
      FILES_REQ,
      new Response(JSON.stringify(files), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  async clear(): Promise<void> {
    await caches.delete(this.cacheName);
  }
}

export function createCatalogMetadataStore(): CatalogMetadataStore {
  if (typeof caches !== "undefined" && typeof caches.open === "function") {
    return new CacheApiCatalogMetadataStore();
  }
  return new MemoryCatalogMetadataStore();
}
