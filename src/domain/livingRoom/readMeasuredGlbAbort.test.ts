import { describe, expect, it, vi } from "vitest";
import { buildTriangleGlb } from "../../workers/modelImport/minimalGlb";
import { createMemoryAssetBlobStore } from "./storedAssets";

const controller = { current: new AbortController() };

vi.mock("./modelImportClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./modelImportClient")>();
  return {
    ...actual,
    // The user cancels while the worker is finishing: the result still arrives.
    measureGlbImport: vi.fn(async () => {
      controller.current.abort();
      return {
        glb: buildTriangleGlb([-1, 0, 0, 1, 0, 0, 0, 1, 0]),
        dimensions: { widthMm: 2000, heightMm: 1000, depthMm: 1 },
        thumbnail: null,
        warnings: [],
        sourceHash: "file:x",
        assetId: "file:x",
        appliedUnit: "m" as const,
        scaleToMm: 1000,
      };
    }),
  };
});

describe("cancelled import", () => {
  it("stores no model or texture blobs once cancelled", async () => {
    const { readImportedGlb } = await import("./readMeasuredGlb");
    controller.current = new AbortController();
    const store = createMemoryAssetBlobStore();
    const files = [
      new File([buildTriangleGlb([-1, 0, 0, 1, 0, 0, 0, 1, 0])], "chair.glb", { type: "model/gltf-binary" }),
      new File([new Uint8Array([1, 2, 3])], "chair_BaseColor.png", { type: "image/png" }),
    ];
    await expect(readImportedGlb(files, store, "m", true, controller.current.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(store.size()).toBe(0);
  });
});
