import type { CatalogFileRecord, ResolvedAsset } from "../types";
import type { CatalogBlobStore } from "./catalogBlobStore";
import {
  CatalogDeliveryCache,
  isRemoteDeliveryExpired,
} from "./catalogDeliveryCache";
import { resolveCdnDeliveryUrl, type CdnResolutionConfig } from "./cdnResolution";
import type { RemoteCatalogTransport } from "./remoteCatalogTransport";
import {
  defaultFetchBytes,
  storeVerifiedDelivery,
  type FetchBytes,
} from "./storeVerifiedDelivery";
import { unavailableResolvedAsset } from "./unavailableAsset";

export type ResolveRemoteDeps = {
  transport: RemoteCatalogTransport;
  cache: CatalogDeliveryCache;
  blobs: CatalogBlobStore;
  cdn: CdnResolutionConfig;
  isOnline: () => boolean;
  fetchBytes?: FetchBytes;
  getFileRecord: (fileId: string) => Promise<CatalogFileRecord | null>;
};

async function resolvedFromBlobs(
  file: CatalogFileRecord,
  blobs: CatalogBlobStore,
): Promise<ResolvedAsset | null> {
  if (!(await blobs.has(file.contentHash))) return null;
  const url = await blobs.objectUrl(file.contentHash, file.mimeType);
  if (!url) return null;
  return {
    fileId: file.id,
    url,
    objectKey: file.objectKey,
    mimeType: file.mimeType,
    byteSize: file.byteSize,
    contentHash: file.contentHash,
    available: true,
    deliverySource: "cache",
    retryable: false,
  };
}

/**
 * Resolve a remote file: verified blob cache → transport/CDN fetch+verify → unavailable.
 * TODO(cdn): wire `transport.resolveDelivery` or set `cdnBaseUrl` when CDN is ready.
 */
export async function resolveRemoteCatalogFile(
  fileId: string,
  deps: ResolveRemoteDeps,
): Promise<ResolvedAsset> {
  await deps.cache.hydrate();
  const fetchBytes = deps.fetchBytes ?? defaultFetchBytes;
  const cachedMeta = deps.cache.getFile(fileId);
  if (cachedMeta) {
    const fromBlob = await deps.cache.toResolvedAsset(cachedMeta, deps.blobs);
    if (fromBlob) return fromBlob;
  }

  let file: CatalogFileRecord | null;
  try {
    file = await deps.getFileRecord(fileId);
  } catch {
    return unavailableResolvedAsset(
      {
        id: fileId,
        objectKey: "",
        mimeType: "application/octet-stream",
        byteSize: 1,
        contentHash: `sha256:${"0".repeat(64)}`,
      },
      deps.isOnline() ? "not-configured" : "offline-uncached",
    );
  }
  if (!file) throw new Error(`Unknown catalog file: ${fileId}`);

  const fromHash = await resolvedFromBlobs(file, deps.blobs);
  if (fromHash) return fromHash;
  if (!deps.isOnline()) return unavailableResolvedAsset(file, "offline-uncached");

  const store = {
    blobs: deps.blobs,
    fetchBytes,
    setFile: deps.cache.setFile.bind(deps.cache),
  };

  if (deps.transport.resolveDelivery) {
    try {
      const delivery = await deps.transport.resolveDelivery(file);
      return storeVerifiedDelivery(
        {
          file,
          remoteUrl: delivery.url,
          etag: delivery.etag,
          expiresAtMs: delivery.expiresAtMs,
          bytes: delivery.bytes,
        },
        store,
      );
    } catch {
      return unavailableResolvedAsset(file, "network");
    }
  }

  if (cachedMeta?.remoteUrl && !isRemoteDeliveryExpired(cachedMeta)) {
    return storeVerifiedDelivery(
      {
        file,
        remoteUrl: cachedMeta.remoteUrl,
        etag: cachedMeta.etag,
        expiresAtMs: cachedMeta.expiresAtMs,
      },
      store,
    );
  }

  const composed = resolveCdnDeliveryUrl(file, deps.cdn);
  if (composed) {
    return storeVerifiedDelivery(
      {
        file,
        remoteUrl: composed.url,
        etag: composed.etag,
        expiresAtMs: composed.expiresAtMs,
      },
      store,
    );
  }

  return unavailableResolvedAsset(file, "not-configured");
}
