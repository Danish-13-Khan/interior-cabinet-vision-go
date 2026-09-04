import type { CatalogFileRecord, ResolvedAsset } from "../types";

export type UnavailableReason =
  | "not-configured"
  | "offline-uncached"
  | "network"
  | "integrity";

/**
 * Build a resolveFile result when CDN delivery is missing or failed.
 * Callers must treat `available: false` as a visual placeholder — never block
 * project open/save on this path (roadmap §8.6).
 */
export function unavailableResolvedAsset(
  file: Pick<CatalogFileRecord, "id" | "objectKey" | "mimeType" | "byteSize" | "contentHash">,
  reason: UnavailableReason,
  retryable = true,
): ResolvedAsset {
  return {
    fileId: file.id,
    url: "",
    objectKey: file.objectKey,
    mimeType: file.mimeType,
    byteSize: file.byteSize,
    contentHash: file.contentHash,
    available: false,
    unavailableReason: reason,
    deliverySource: "unavailable",
    retryable,
  };
}

export function isResolvedAssetAvailable(asset: ResolvedAsset): boolean {
  return asset.available !== false && asset.url.length > 0;
}
