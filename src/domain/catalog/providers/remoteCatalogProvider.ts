import { assertValidCatalogManifest } from "../schema";
import type {
  CatalogItem,
  CatalogManifest,
  CatalogPage,
  CatalogQuery,
  ResolvedAsset,
} from "../types";
import { createCatalogBlobStore, type CatalogBlobStore } from "./catalogBlobStore";
import { CatalogDeliveryCache } from "./catalogDeliveryCache";
import { matchesCatalogQuery } from "./catalogItemQuery";
import type { CdnResolutionConfig } from "./cdnResolution";
import { resolveRemoteCatalogFile } from "./resolveRemoteCatalogFile";
import {
  notConfiguredRemoteTransport,
  type RemoteCatalogTransport,
} from "./remoteCatalogTransport";
import type { FetchBytes } from "./storeVerifiedDelivery";
import type { CatalogProvider } from "./types";

export type RemoteCatalogProviderOptions = CdnResolutionConfig & {
  transport?: RemoteCatalogTransport;
  cache?: CatalogDeliveryCache;
  blobs?: CatalogBlobStore;
  fetchBytes?: FetchBytes;
  /** When true, treat missing network as offline (default: navigator.onLine if present). */
  isOnline?: () => boolean;
};

function onlineCheck(isOnline?: () => boolean): boolean {
  if (isOnline) return isOnline();
  if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
    return navigator.onLine;
  }
  return true;
}

function pageFromManifest(manifest: CatalogManifest, query?: CatalogQuery): CatalogPage {
  const items = manifest.items.filter((item) => matchesCatalogQuery(item, query));
  return { items, total: items.length };
}

function itemFromManifest(
  manifest: CatalogManifest,
  id: string,
  version?: number,
): CatalogItem | null {
  const item = manifest.items.find((candidate) => candidate.id === id) ?? null;
  if (!item) return null;
  if (version !== undefined && item.version !== version) return null;
  return item;
}

/**
 * Remote/CDN catalog provider (Phase 7 readiness).
 * Same `CatalogProvider` contract as built-in; projects keep stable IDs only.
 */
export class RemoteCatalogProvider implements CatalogProvider {
  private readonly transport: RemoteCatalogTransport;
  private readonly cache: CatalogDeliveryCache;
  private readonly blobs: CatalogBlobStore;
  private readonly cdn: CdnResolutionConfig;
  private readonly fetchBytes?: FetchBytes;
  private readonly isOnline: () => boolean;
  private inflightManifest: Promise<CatalogManifest> | null = null;

  constructor(options: RemoteCatalogProviderOptions = {}) {
    this.transport = options.transport ?? notConfiguredRemoteTransport;
    this.cache = options.cache ?? new CatalogDeliveryCache();
    this.blobs = options.blobs ?? createCatalogBlobStore();
    this.cdn = { cdnBaseUrl: options.cdnBaseUrl, cdnPathPrefix: options.cdnPathPrefix };
    this.fetchBytes = options.fetchBytes;
    this.isOnline = () => onlineCheck(options.isOnline);
  }

  async getManifest(): Promise<CatalogManifest> {
    if (this.inflightManifest) return this.inflightManifest;
    this.inflightManifest = this.loadManifest().finally(() => {
      this.inflightManifest = null;
    });
    return this.inflightManifest;
  }

  private async loadManifest(): Promise<CatalogManifest> {
    await this.cache.hydrate();
    const cached = this.cache.getManifest();
    if (!this.isOnline()) {
      if (cached) return cached.manifest;
      throw new Error("Catalog manifest unavailable offline (uncached)");
    }
    try {
      const response = await this.transport.fetchManifest({ etag: cached?.etag });
      if (response.notModified && cached) return cached.manifest;
      assertValidCatalogManifest(response.manifest);
      await this.cache.setManifest({
        catalogVersion: response.manifest.catalogVersion,
        etag: response.etag,
        manifest: response.manifest,
        fetchedAtMs: Date.now(),
      });
      return response.manifest;
    } catch (error) {
      if (cached) return cached.manifest;
      throw error;
    }
  }

  async listItems(query?: CatalogQuery): Promise<CatalogPage> {
    await this.cache.hydrate();
    if (this.transport.listItems && this.isOnline()) {
      try {
        return await this.transport.listItems(query);
      } catch {
        /* fall through to cached manifest */
      }
    }
    return pageFromManifest(await this.getManifest(), query);
  }

  async getItem(id: string, version?: number): Promise<CatalogItem | null> {
    await this.cache.hydrate();
    if (this.transport.getItem && this.isOnline()) {
      try {
        return await this.transport.getItem(id, version);
      } catch {
        /* fall through to cached manifest */
      }
    }
    return itemFromManifest(await this.getManifest(), id, version);
  }

  async resolveFile(fileId: string): Promise<ResolvedAsset> {
    await this.cache.hydrate();
    return resolveRemoteCatalogFile(fileId, {
      transport: this.transport,
      cache: this.cache,
      blobs: this.blobs,
      cdn: this.cdn,
      isOnline: this.isOnline,
      fetchBytes: this.fetchBytes,
      getFileRecord: async (id) => {
        const manifest = await this.getManifest();
        return manifest.files.find((candidate) => candidate.id === id) ?? null;
      },
    });
  }
}

export type {
  RemoteCatalogTransport,
  RemoteDeliveryResponse,
  RemoteManifestResponse,
} from "./remoteCatalogTransport";
export { notConfiguredRemoteTransport } from "./remoteCatalogTransport";
