import { describe, expect, it } from "vitest";
import { getBounds } from "@gltf-transform/functions";
import { WebIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import { buildTriangleGlb } from "./minimalGlb";
import { optimizeGlb, simplifyRatio } from "./optimize";

function denseGlb(): ArrayBuffer {
  const positions: number[] = [];
  for (let i = 0; i < 4000; i += 1) {
    const x = (i % 50) / 10;
    const z = Math.floor(i / 50) / 10;
    positions.push(x, 0, z, x + 0.2, 0, z, x, 0.2, z);
  }
  return buildTriangleGlb(positions);
}

describe("model optimizer", () => {
  it("simplifies only above the triangle budget", () => {
    expect(simplifyRatio(1000)).toBeNull();
    expect(simplifyRatio(400_000)).toBeCloseTo(0.5);
  });

  it("writes a smaller meshopt GLB without Draco and keeps the bbox", async () => {
    const input = denseGlb();
    const optimized = await optimizeGlb(input);
    expect(optimized.glb.byteLength).toBeLessThan(input.byteLength);
    const jsonLength = new DataView(optimized.glb.buffer, optimized.glb.byteOffset).getUint32(12, true);
    const json = new TextDecoder().decode(optimized.glb.slice(20, 20 + jsonLength));
    expect(json).not.toContain("KHR_draco_mesh_compression");
    expect(json).toContain("EXT_meshopt_compression");
    await MeshoptDecoder.ready;
    const io = new WebIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
    const before = getBounds((await io.readBinary(new Uint8Array(input))).getRoot().listScenes()[0]);
    const after = getBounds((await io.readBinary(optimized.glb)).getRoot().listScenes()[0]);
    expect(after.max[0] - after.min[0]).toBeCloseTo(before.max[0] - before.min[0], 0);
    expect(after.max[1]).toBeGreaterThanOrEqual(-0.01);
  });
});
