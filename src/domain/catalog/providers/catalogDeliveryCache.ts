import type { ResolvedAsset } from "../types";
import type { CatalogBlobStore } from "./catalogBlobStore";
import {
  persistableFileEntry,
  type CachedFileEntry,
  type CachedManifestEntry,
} from "./catalogCacheEntries";
import {
  createCatalogMetadataStore,
  type CatalogMetadataStore,
} from "./catalogMetadataStore";

export type { CachedFileEntry, CachedManifestEntry } from "./catalogCacheEntries";
export { isRemoteDeliveryExpired, persistableFileEntry } from "./catalogCacheEntries";

/**
 * Metadata cache for remote catalog delivery.
 * Verified bytes live in {@link CatalogBlobStore}; this map tracks file identity.
 * When a {@link CatalogMetadataStore} is provided, manifest + file maps survive reload.
 */
export class CatalogDeliveryCache {
  private manifest: CachedManifestEntry | null = null;
  private readonly files = new Map<string, CachedFileEntry>();
  private readonly store: CatalogMetadataStore;
  private hydratePromise: Promise<void> | null = null;

  constructor(store: CatalogMetadataStore = createCatalogMetadataStore()) {
    this.store = store;
  }

  /** Load durable manifest/file metadata (idempotent). Call before offline resolve. */
  async hydrate(): Promise<void> {
    if (!this.hydratePromise) {
      this.hydratePromise = this.loadFromStore();
    }
    await this.hydratePromise;
  }

  private async loadFromStore(): Promise<void> {
    const snapshot = await this.store.load();
    this.manifest = snapshot.manifest;
    this.files.clear();
    for (const entry of snapshot.files) {
      this.files.set(entry.fileId, entry);
    }
  }

  private async persist(): Promise<void> {
    await this.store.save({
      manifest: this.manifest,
      files: [...this.files.values()].map(persistableFileEntry),
    });
  }

  getManifest(): CachedManifestEntry | null {
    return this.manifest;
  }

  async setManifest(entry: CachedManifestEntry): Promise<void> {
    this.manifest = entry;
    await this.persist();
  }

  isManifestFresh(catalogVersion: string, etag?: string): boolean {
    if (!this.manifest) return false;
    if (this.manifest.catalogVersion !== catalogVersion) return false;
    if (etag !== undefined && this.manifest.etag !== etag) return false;
    return true;
  }

  getFile(fileId: string): CachedFileEntry | null {
    return this.files.get(fileId) ?? null;
  }

  async setFile(entry: CachedFileEntry): Promise<void> {
    this.files.set(entry.fileId, entry);
    await this.persist();
  }

  getFileByHash(contentHash: string): CachedFileEntry | null {
    for (const entry of this.files.values()) {
      if (entry.contentHash === contentHash) return entry;
    }
    return null;
  }

  async toResolvedAsset(
    entry: CachedFileEntry,
    blobs: CatalogBlobStore,
  ): Promise<ResolvedAsset | null> {
    if (!(await blobs.has(entry.contentHash))) return null;
    const url = await blobs.objectUrl(entry.contentHash, entry.mimeType);
    if (!url) return null;
    return {
      fileId: entry.fileId,
      url,
      objectKey: entry.objectKey,
      mimeType: entry.mimeType,
      byteSize: entry.byteSize,
      contentHash: entry.contentHash,
      available: true,
      deliverySource: "cache",
      etag: entry.etag,
      retryable: false,
    };
  }

  async clear(): Promise<void> {
    this.manifest = null;
    this.files.clear();
    await this.store.clear();
    this.hydratePromise = null;
  }
}

