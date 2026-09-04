/**
 * Durable-ish storage for integrity-verified catalog file bytes.
 * Keys are content hashes (`sha256:…`) — immutable cache identity (roadmap §8.5).
 */
export type CatalogBlobStore = {
  get(contentHash: string): Promise<ArrayBuffer | null>;
  put(contentHash: string, bytes: ArrayBuffer, mimeType: string): Promise<void>;
  /** Object URL for loaders; reused per hash until revoke/clear. */
  objectUrl(contentHash: string, mimeType: string): Promise<string | null>;
  has(contentHash: string): Promise<boolean>;
  clear(): Promise<void>;
};

type MemoryBlob = { bytes: ArrayBuffer; mimeType: string; objectUrl?: string };

/** Session blob store — used in tests and when Cache API is unavailable. */
export class MemoryCatalogBlobStore implements CatalogBlobStore {
  private readonly blobs = new Map<string, MemoryBlob>();

  async get(contentHash: string): Promise<ArrayBuffer | null> {
    return this.blobs.get(contentHash)?.bytes ?? null;
  }

  async put(contentHash: string, bytes: ArrayBuffer, mimeType: string): Promise<void> {
    const prev = this.blobs.get(contentHash);
    if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
    this.blobs.set(contentHash, { bytes, mimeType });
  }

  async objectUrl(contentHash: string, mimeType: string): Promise<string | null> {
    const entry = this.blobs.get(contentHash);
    if (!entry) return null;
    if (entry.objectUrl) return entry.objectUrl;
    const url = URL.createObjectURL(
      new Blob([new Uint8Array(entry.bytes)], { type: mimeType || entry.mimeType }),
    );
    entry.objectUrl = url;
    return url;
  }

  async has(contentHash: string): Promise<boolean> {
    return this.blobs.has(contentHash);
  }

  async clear(): Promise<void> {
    for (const entry of this.blobs.values()) {
      if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
    }
    this.blobs.clear();
  }
}

const CACHE_NAME = "catalog-blobs-v1";

function blobRequest(contentHash: string): Request {
  return new Request(`https://catalog.local/blob/${encodeURIComponent(contentHash)}`);
}

/**
 * Cache API–backed blob store (survives reload in supporting browsers).
 * TODO(cdn): optionally mirror into IndexedDB for browsers without Cache API.
 */
export class CacheApiCatalogBlobStore implements CatalogBlobStore {
  private readonly memory = new MemoryCatalogBlobStore();

  constructor(private readonly cacheName = CACHE_NAME) {}

  private async cache(): Promise<Cache> {
    return caches.open(this.cacheName);
  }

  async get(contentHash: string): Promise<ArrayBuffer | null> {
    const cached = await this.memory.get(contentHash);
    if (cached) return cached;
    const response = await (await this.cache()).match(blobRequest(contentHash));
    if (!response) return null;
    const bytes = await response.arrayBuffer();
    const mimeType = response.headers.get("Content-Type") ?? "application/octet-stream";
    await this.memory.put(contentHash, bytes, mimeType);
    return bytes;
  }

  async put(contentHash: string, bytes: ArrayBuffer, mimeType: string): Promise<void> {
    await this.memory.put(contentHash, bytes, mimeType);
    await (await this.cache()).put(
      blobRequest(contentHash),
      new Response(bytes, { headers: { "Content-Type": mimeType } }),
    );
  }

  async objectUrl(contentHash: string, mimeType: string): Promise<string | null> {
    if (!(await this.has(contentHash))) return null;
    await this.get(contentHash);
    return this.memory.objectUrl(contentHash, mimeType);
  }

  async has(contentHash: string): Promise<boolean> {
    if (await this.memory.has(contentHash)) return true;
    return Boolean(await (await this.cache()).match(blobRequest(contentHash)));
  }

  async clear(): Promise<void> {
    await this.memory.clear();
    await caches.delete(this.cacheName);
  }
}

export function createCatalogBlobStore(): CatalogBlobStore {
  if (typeof caches !== "undefined" && typeof caches.open === "function") {
    return new CacheApiCatalogBlobStore();
  }
  return new MemoryCatalogBlobStore();
}
