import type { CatalogManifest } from "../types";

export type CachedManifestEntry = {
  catalogVersion: string;
  etag?: string;
  manifest: CatalogManifest;
  fetchedAtMs: number;
};

export type CachedFileEntry = {
  fileId: string;
  contentHash: string;
  byteSize: number;
  objectKey: string;
  mimeType: string;
  cachedAtMs: number;
  etag?: string;
  /** Ephemeral remote/signed URL — session only; not written to durable metadata. */
  remoteUrl?: string;
  /** When set, remoteUrl must be refreshed after this time. */
  expiresAtMs?: number;
};

export function isRemoteDeliveryExpired(
  entry: Pick<CachedFileEntry, "expiresAtMs">,
  nowMs = Date.now(),
): boolean {
  return entry.expiresAtMs !== undefined && entry.expiresAtMs <= nowMs;
}

/** Strip ephemeral signed URLs before durable write. */
export function persistableFileEntry(entry: CachedFileEntry): CachedFileEntry {
  return {
    fileId: entry.fileId,
    contentHash: entry.contentHash,
    byteSize: entry.byteSize,
    objectKey: entry.objectKey,
    mimeType: entry.mimeType,
    cachedAtMs: entry.cachedAtMs,
    etag: entry.etag,
  };
}
