import { describe, expect, it } from "vitest";
import builtinCatalogJson from "../../../public/catalog/builtin-catalog.v1.json";
import {
  CatalogDeliveryCache,
  MemoryCatalogBlobStore,
  MemoryCatalogMetadataStore,
  RemoteCatalogProvider,
  type CatalogManifest,
  type RemoteCatalogTransport,
} from ".";
import {
  PHASE7_FILE_ID as FILE_ID,
  copyBytes,
  patchFileIntegrity,
  sha256Hex,
} from "./phase7CdnReadiness.testHelpers";

describe("Phase 7 offline reload persistence", () => {
  it("recovers verified blobs after a fresh provider/cache hydrate", async () => {
    const payload = new TextEncoder().encode("reload-bytes");
    const hash = `sha256:${await sha256Hex(payload)}`;
    const manifest = patchFileIntegrity(
      builtinCatalogJson as CatalogManifest,
      FILE_ID,
      hash,
      payload.byteLength,
    );
    const metaStore = new MemoryCatalogMetadataStore();
    const blobs = new MemoryCatalogBlobStore();
    const transport: RemoteCatalogTransport = {
      async fetchManifest() {
        return { manifest };
      },
    };

    const online = new RemoteCatalogProvider({
      transport,
      cache: new CatalogDeliveryCache(metaStore),
      blobs,
      cdnBaseUrl: "https://cdn.example.com",
      fetchBytes: async () => copyBytes(payload),
      isOnline: () => true,
    });
    const first = await online.resolveFile(FILE_ID);
    expect(first.available).toBe(true);
    expect(first.url.startsWith("blob:")).toBe(true);

    // Simulate app reload: new cache + provider, same durable stores, offline.
    const reloaded = new RemoteCatalogProvider({
      transport,
      cache: new CatalogDeliveryCache(metaStore),
      blobs,
      isOnline: () => false,
    });
    const second = await reloaded.resolveFile(FILE_ID);
    expect(second.available).toBe(true);
    expect(second.deliverySource).toBe("cache");
    expect(second.contentHash).toBe(hash);
    expect(second.url.startsWith("blob:")).toBe(true);
    expect((await reloaded.getManifest()).catalogVersion).toBe(manifest.catalogVersion);
  });
});
