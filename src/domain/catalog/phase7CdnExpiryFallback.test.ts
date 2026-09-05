import { describe, expect, it } from "vitest";
import { BUILTIN_CATALOG_MANIFEST as builtinCatalogJson } from "./builtinCatalogManifest";
import {
  CatalogDeliveryCache,
  MemoryCatalogBlobStore,
  MemoryCatalogMetadataStore,
  RemoteCatalogProvider,
  isRemoteDeliveryExpired,
  type CatalogManifest,
  type RemoteCatalogTransport,
} from ".";
import {
  PHASE7_FILE_ID as FILE_ID,
  copyBytes,
  patchFileIntegrity,
  sha256Hex,
} from "./phase7CdnReadiness.testHelpers";

describe("Phase 7 CDN expiry and item fallback", () => {
  it("rejects integrity failures and refreshes expired signed URLs", async () => {
    const good = new TextEncoder().encode("good");
    const bad = new TextEncoder().encode("bad!");
    const hash = `sha256:${await sha256Hex(good)}`;
    const manifest = patchFileIntegrity(
      builtinCatalogJson as CatalogManifest,
      FILE_ID,
      hash,
      good.byteLength,
    );
    const failed = await new RemoteCatalogProvider({
      transport: {
        async fetchManifest() {
          return { manifest };
        },
        async resolveDelivery() {
          return {
            url: "https://cdn.example.com/signed?token=stale",
            expiresAtMs: Date.now() - 1_000,
            bytes: copyBytes(bad),
          };
        },
      },
      cache: new CatalogDeliveryCache(new MemoryCatalogMetadataStore()),
      blobs: new MemoryCatalogBlobStore(),
      isOnline: () => true,
    }).resolveFile(FILE_ID);
    expect(failed.unavailableReason).toBe("integrity");

    let deliveryCalls = 0;
    const cache = new CatalogDeliveryCache(new MemoryCatalogMetadataStore());
    await cache.setFile({
      fileId: FILE_ID,
      contentHash: hash,
      byteSize: good.byteLength,
      objectKey: "models/kenney-furniture/models_glb/loungeSofa.glb",
      mimeType: "model/gltf-binary",
      cachedAtMs: Date.now(),
      remoteUrl: "https://cdn.example.com/signed?token=expired",
      expiresAtMs: Date.now() - 5_000,
    });
    expect(isRemoteDeliveryExpired(cache.getFile(FILE_ID)!)).toBe(true);

    const refreshed = await new RemoteCatalogProvider({
      transport: {
        async fetchManifest() {
          return { manifest };
        },
        async resolveDelivery() {
          deliveryCalls += 1;
          return {
            url: `https://cdn.example.com/signed?n=${deliveryCalls}`,
            expiresAtMs: Date.now() + 60_000,
            bytes: copyBytes(good),
          };
        },
      },
      cache,
      blobs: new MemoryCatalogBlobStore(),
      isOnline: () => true,
    }).resolveFile(FILE_ID);
    expect(deliveryCalls).toBe(1);
    expect(refreshed.available).toBe(true);
    expect(cache.getFile(FILE_ID)?.expiresAtMs).toBeGreaterThan(Date.now());
  });

  it("falls back to cached manifest when listItems/getItem fail or offline", async () => {
    const manifest = builtinCatalogJson as CatalogManifest;
    const metaStore = new MemoryCatalogMetadataStore();
    const cache = new CatalogDeliveryCache(metaStore);
    const transport: RemoteCatalogTransport = {
      async fetchManifest() {
        return { manifest, etag: "etag-1" };
      },
      async listItems() {
        throw new Error("search down");
      },
      async getItem() {
        throw new Error("item down");
      },
    };
    const online = new RemoteCatalogProvider({
      transport,
      cache,
      blobs: new MemoryCatalogBlobStore(),
      isOnline: () => true,
    });
    await online.getManifest();
    expect(
      (await online.listItems({ text: "sofa" })).items.some((i) => i.id === "kenney:lounge-sofa"),
    ).toBe(true);
    expect(await online.getItem("kenney:lounge-sofa")).not.toBeNull();

    const offline = new RemoteCatalogProvider({
      transport,
      cache: new CatalogDeliveryCache(metaStore),
      blobs: new MemoryCatalogBlobStore(),
      isOnline: () => false,
    });
    expect((await offline.listItems({ category: "seating" })).total).toBeGreaterThan(0);
    expect(await offline.getItem("kenney:lounge-sofa")).not.toBeNull();
  });
});
