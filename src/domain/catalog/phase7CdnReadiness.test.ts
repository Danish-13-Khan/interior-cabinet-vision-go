import { describe, expect, it } from "vitest";
import builtinCatalogJson from "../../../public/catalog/builtin-catalog.v1.json";
import {
  CatalogDeliveryCache,
  MemoryCatalogBlobStore,
  MemoryCatalogMetadataStore,
  RemoteCatalogProvider,
  createCatalogProvider,
  isResolvedAssetAvailable,
  isSha256ContentHash,
  resolveCdnDeliveryUrl,
  verifyContentIntegrity,
  type CatalogManifest,
  type RemoteCatalogTransport,
} from ".";
import {
  PHASE7_FILE_ID as FILE_ID,
  copyBytes,
  patchFileIntegrity,
  sha256Hex,
} from "./phase7CdnReadiness.testHelpers";

describe("Phase 7 CDN readiness", () => {
  it("createCatalogProvider defaults to built-in offline resolution", async () => {
    const provider = createCatalogProvider();
    const resolved = await provider.resolveFile(FILE_ID);
    expect(resolved.deliverySource).toBe("builtin");
    expect(resolved.available).toBe(true);
    expect(resolved.url).toContain("loungeSofa.glb");
  });

  it("resolveCdnDeliveryUrl is a no-op until cdnBaseUrl is set", () => {
    expect(resolveCdnDeliveryUrl({ objectKey: "models/a.glb" }, {})).toBeNull();
    expect(
      resolveCdnDeliveryUrl(
        { objectKey: "models/a.glb" },
        { cdnBaseUrl: "https://cdn.example.com", cdnPathPrefix: "catalog/v1" },
      ),
    ).toEqual({ url: "https://cdn.example.com/catalog/v1/models/a.glb" });
  });

  it("remote provider returns unavailable when CDN is not configured", async () => {
    const transport: RemoteCatalogTransport = {
      async fetchManifest() {
        return { manifest: builtinCatalogJson as CatalogManifest, etag: "etag-1" };
      },
    };
    const provider = new RemoteCatalogProvider({
      transport,
      cache: new CatalogDeliveryCache(new MemoryCatalogMetadataStore()),
      blobs: new MemoryCatalogBlobStore(),
      isOnline: () => true,
    });
    const resolved = await provider.resolveFile(FILE_ID);
    expect(resolved.available).toBe(false);
    expect(resolved.unavailableReason).toBe("not-configured");
    expect(isResolvedAssetAvailable(resolved)).toBe(false);
  });

  it("verifies CDN bytes before available and serves offline from blob cache", async () => {
    const payload = new TextEncoder().encode("sofa-bytes");
    const hash = `sha256:${await sha256Hex(payload)}`;
    expect(isSha256ContentHash(hash)).toBe(true);
    expect(await verifyContentIntegrity(payload, hash, payload.byteLength)).toEqual({ ok: true });

    const manifest = patchFileIntegrity(
      builtinCatalogJson as CatalogManifest,
      FILE_ID,
      hash,
      payload.byteLength,
    );
    const metaStore = new MemoryCatalogMetadataStore();
    const blobs = new MemoryCatalogBlobStore();
    const cache = new CatalogDeliveryCache(metaStore);
    const transport: RemoteCatalogTransport = {
      async fetchManifest() {
        return { manifest };
      },
    };
    const online = new RemoteCatalogProvider({
      transport,
      cache,
      blobs,
      cdnBaseUrl: "https://cdn.example.com",
      fetchBytes: async (url) => {
        expect(url).toContain("loungeSofa.glb");
        return copyBytes(payload);
      },
      isOnline: () => true,
    });
    const resolved = await online.resolveFile(FILE_ID);
    expect(resolved.available).toBe(true);
    expect(resolved.deliverySource).toBe("cdn");
    expect(resolved.url.startsWith("blob:")).toBe(true);

    const offline = new RemoteCatalogProvider({
      transport,
      cache: new CatalogDeliveryCache(metaStore),
      blobs,
      isOnline: () => false,
    });
    const cached = await offline.resolveFile(FILE_ID);
    expect(cached.available).toBe(true);
    expect(cached.deliverySource).toBe("cache");
    expect(cached.url.startsWith("blob:")).toBe(true);
  });
});
