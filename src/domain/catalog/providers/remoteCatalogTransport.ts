import type {
  CatalogFileRecord,
  CatalogItem,
  CatalogManifest,
  CatalogPage,
  CatalogQuery,
} from "../types";

export type RemoteManifestResponse = {
  manifest: CatalogManifest;
  etag?: string;
  /** HTTP 304 — reuse cache without a new body. */
  notModified?: boolean;
};

export type RemoteDeliveryResponse = {
  url: string;
  etag?: string;
  expiresAtMs?: number;
  /**
   * Optional pre-fetched bytes. When omitted, the provider fetches `url` and
   * verifies SHA-256 + byteSize before marking the asset available.
   */
  bytes?: ArrayBuffer;
};

/**
 * Network / API surface for a remote catalog.
 *
 * TODO(cdn): Implement this against the real catalog API + CDN once provisioned.
 * Until then, leave `transport` unset (or use `notConfiguredRemoteTransport`) —
 * `RemoteCatalogProvider` still exercises cache, integrity, and offline paths.
 */
export type RemoteCatalogTransport = {
  fetchManifest(opts: { etag?: string }): Promise<RemoteManifestResponse>;
  listItems?(query?: CatalogQuery): Promise<CatalogPage>;
  getItem?(id: string, version?: number): Promise<CatalogItem | null>;
  /**
   * Authorized or public delivery URL for a file.
   * Prefer short-lived signed URLs for private assets.
   * Never persist the URL in project JSON.
   */
  resolveDelivery?(file: CatalogFileRecord): Promise<RemoteDeliveryResponse>;
};

/** Default transport until a CDN/API exists — all calls fail closed to offline paths. */
export const notConfiguredRemoteTransport: RemoteCatalogTransport = {
  async fetchManifest() {
    throw new Error("Remote catalog API not configured (TODO: wire CDN/catalog API)");
  },
};
