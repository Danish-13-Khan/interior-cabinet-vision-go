import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./modelImportClient", () => ({
  measureGlbImport: vi.fn(),
  defaultGlbSettings: (unit: string) => ({ unit, upAxis: "y", optimizerVersion: 0 }),
  dimensionsForPlacement: (existing: unknown, measured: unknown) => existing ?? measured,
}));

import { measureGlbImport } from "./modelImportClient";
import { readImportedGlb } from "./readMeasuredGlb";
import { createMemoryAssetBlobStore } from "./storedAssets";

const failed = {
  glb: null as ArrayBuffer | null,
  dimensions: { widthMm: 10, heightMm: 10, depthMm: 10 },
  thumbnail: null,
  warnings: [] as string[],
  sourceHash: "file:x",
  assetId: "file:x",
  appliedUnit: "m" as const,
  scaleToMm: 1000,
};

describe("optimized GLB storage", () => {
  beforeEach(() => { vi.mocked(measureGlbImport).mockReset(); });

  it("does not store the raw file when conversion returns null", async () => {
    vi.mocked(measureGlbImport).mockResolvedValue(failed);
    const store = createMemoryAssetBlobStore();
    const raw = new Uint8Array([0x4b, 0x61, 0x79, 0x64]);
    await expect(readImportedGlb(new File([raw], "sofa.fbx"), store)).rejects.toThrow(/convert the model to GLB/);
    expect(store.size()).toBe(0);
  });

  it("rejects an optimized GLB over 25 MB before storing it", async () => {
    vi.mocked(measureGlbImport).mockResolvedValue({ ...failed, glb: new ArrayBuffer(25 * 1024 * 1024 + 1) });
    const store = createMemoryAssetBlobStore();
    await expect(readImportedGlb(new File([new Uint8Array([1])], "sofa.glb"), store)).rejects.toThrow(/25 MB/);
    expect(store.size()).toBe(0);
  });
});
