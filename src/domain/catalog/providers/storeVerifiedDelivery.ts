import type { CachedFileEntry } from "./catalogCacheEntries";
import type { CatalogBlobStore } from "./catalogBlobStore";
import { unavailableResolvedAsset } from "./unavailableAsset";
import type { CatalogFileRecord, ResolvedAsset } from "../types";
import { verifyContentIntegrity } from "../contentIntegrity";

export type FetchBytes = (url: string) => Promise<ArrayBuffer>;

export const defaultFetchBytes: FetchBytes = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`CDN fetch failed (${response.status}) for ${url}`);
  return response.arrayBuffer();
};

export type VerifiedDeliveryInput = {
  file: CatalogFileRecord;
  remoteUrl: string;
  etag?: string;
  expiresAtMs?: number;
  /** When omitted, bytes are fetched from remoteUrl and then verified. */
  bytes?: ArrayBuffer;
};

/**
 * Fetch (if needed), verify hash + byteSize, persist bytes, return available asset.
 * Assets are never marked available without a successful integrity check.
 */
export async function storeVerifiedDelivery(
  input: VerifiedDeliveryInput,
  deps: {
    blobs: CatalogBlobStore;
    fetchBytes: FetchBytes;
    setFile: (entry: CachedFileEntry) => void | Promise<void>;
  },
): Promise<ResolvedAsset> {
  const { file } = input;
  let bytes = input.bytes;
  if (!bytes) {
    try {
      bytes = await deps.fetchBytes(input.remoteUrl);
    } catch {
      return unavailableResolvedAsset(file, "network");
    }
  }

  const check = await verifyContentIntegrity(bytes, file.contentHash, file.byteSize);
  if (!check.ok) return unavailableResolvedAsset(file, "integrity", true);

  const copy = bytes.slice(0);
  await deps.blobs.put(file.contentHash, copy, file.mimeType);
  const entry: CachedFileEntry = {
    fileId: file.id,
    contentHash: file.contentHash,
    byteSize: file.byteSize,
    objectKey: file.objectKey,
    mimeType: file.mimeType,
    cachedAtMs: Date.now(),
    etag: input.etag,
    remoteUrl: input.remoteUrl,
    expiresAtMs: input.expiresAtMs,
  };
  await deps.setFile(entry);

  const url = await deps.blobs.objectUrl(file.contentHash, file.mimeType);
  if (!url) return unavailableResolvedAsset(file, "integrity", true);

  return {
    fileId: file.id,
    url,
    objectKey: file.objectKey,
    mimeType: file.mimeType,
    byteSize: file.byteSize,
    contentHash: file.contentHash,
    available: true,
    deliverySource: "cdn",
    etag: input.etag,
    retryable: false,
  };
}
