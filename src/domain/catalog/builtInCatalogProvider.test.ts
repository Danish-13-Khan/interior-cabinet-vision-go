import { afterEach, describe, expect, it } from "vitest";
import {
  BuiltInCatalogProvider,
  getCatalogItem,
  listCatalogItems,
  resolveCatalogFile,
  setCatalogProvider,
} from ".";

describe("BuiltInCatalogProvider", () => {
  afterEach(() => {
    setCatalogProvider(null);
  });

  it("resolves lounge sofa item and model url", async () => {
    const provider = new BuiltInCatalogProvider();
    setCatalogProvider(provider);
    const item = await getCatalogItem("kenney:lounge-sofa");
    expect(item?.name).toBe("Lounge Sofa");
    expect(item?.modelAssetId).toBe("model:kenney:lounge-sofa:v1");
    const resolved = await resolveCatalogFile(item!.modelAssetId);
    expect(resolved.url).toBe("/models/kenney-furniture/models_glb/loungeSofa.glb");
    expect(resolved.contentHash.startsWith("sha256:")).toBe(true);
  });

  it("prefixes GitHub Pages base when resolving catalog files", async () => {
    const provider = new BuiltInCatalogProvider(undefined, {
      baseUrl: "/interior-cabinet-vision-go/",
    });
    const resolved = await provider.resolveFile("model:kenney:lounge-sofa:v1");
    expect(resolved.url).toBe(
      "/interior-cabinet-vision-go/models/kenney-furniture/models_glb/loungeSofa.glb",
    );
  });

  it("filters by lifecycle and text query", async () => {
    const blocked = await listCatalogItems({ lifecycle: "blocked" });
    expect(blocked.total).toBe(20);
    expect(blocked.items.every((item) => item.lifecycle === "blocked")).toBe(true);

    const seating = await listCatalogItems({ category: "seating", text: "sofa" });
    expect(seating.items.some((item) => item.id === "kenney:lounge-sofa")).toBe(true);
    expect(seating.items.every((item) => item.category === "seating")).toBe(true);
  });

  it("returns null for unknown or version-mismatched items", async () => {
    const provider = new BuiltInCatalogProvider();
    expect(await provider.getItem("kenney:does-not-exist")).toBeNull();
    expect(await provider.getItem("kenney:lounge-sofa", 99)).toBeNull();
    expect(await provider.getItem("kenney:lounge-sofa", 1)).not.toBeNull();
  });

  it("rejects unknown file ids", async () => {
    const provider = new BuiltInCatalogProvider();
    await expect(provider.resolveFile("model:missing")).rejects.toThrow(/Unknown catalog file/);
  });
});
