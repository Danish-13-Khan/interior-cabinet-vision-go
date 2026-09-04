import type { CatalogFileRecord } from "../types";

export type CdnResolutionConfig = {
  /**
   * Public CDN origin, e.g. `https://cdn.example.com`.
   * Leave unset until a CDN is provisioned — resolution stays a no-op stub.
   */
  cdnBaseUrl?: string;
  /**
   * Optional path prefix inside the bucket / CDN, e.g. `catalog/v1`.
   * Combined as `${cdnBaseUrl}/${cdnPathPrefix}/${objectKey}`.
   */
  cdnPathPrefix?: string;
};

export type CdnDelivery = {
  /** Ephemeral or public CDN URL — never persist in project JSON. */
  url: string;
  etag?: string;
  /** Short-lived signed URLs set expiresAtMs; public immutable URLs omit it. */
  expiresAtMs?: number;
};

/**
 * Resolve a catalog file's `objectKey` to a CDN delivery URL.
 *
 * TODO(cdn): When the CDN is ready, either:
 *  1. Point `cdnBaseUrl` at the public bucket origin for immutable public assets, or
 *  2. Replace this helper with an authorized signed-URL call (private org assets).
 * Do not store the returned URL on the project — only stable file / item IDs.
 */
export function resolveCdnDeliveryUrl(
  file: Pick<CatalogFileRecord, "objectKey">,
  config: CdnResolutionConfig,
): CdnDelivery | null {
  const base = config.cdnBaseUrl?.trim().replace(/\/+$/, "");
  if (!base) {
    // CDN not configured yet — caller should fall back to cache / unavailable.
    return null;
  }
  const prefix = config.cdnPathPrefix?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  const key = file.objectKey.replace(/^\/+/, "");
  const path = prefix ? `${prefix}/${key}` : key;
  return { url: `${base}/${path}` };
}
