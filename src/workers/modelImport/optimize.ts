import { WebIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { dedup, flatten, getBounds, instance, meshopt, prune, simplify, weld } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { resizeDocumentTextures } from "./textureResize";

export const TRIANGLE_BUDGET = 200_000;
export { MAX_TEXTURE_PX } from "./textureResize";

export function simplifyRatio(triangles: number, budget = TRIANGLE_BUDGET): number | null {
  if (triangles <= budget) return null;
  return budget / triangles;
}

function triangleCount(indices: number): number {
  return Math.floor(indices / 3);
}

function countTriangles(document: Awaited<ReturnType<WebIO["readBinary"]>>): number {
  let triangles = 0;
  for (const mesh of document.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const indices = prim.getIndices();
      triangles += indices ? triangleCount(indices.getCount()) : triangleCount(prim.getAttribute("POSITION")?.getCount() ?? 0);
    }
  }
  return triangles;
}

export async function optimizeGlb(bytes: ArrayBuffer): Promise<{ glb: Uint8Array; beforeTriangles: number; afterTriangles: number }> {
  await MeshoptEncoder.ready;
  await MeshoptSimplifier.ready;
  const io = new WebIO()
    .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
  const document = await io.readBinary(new Uint8Array(bytes));
  const beforeTriangles = countTriangles(document);
  await resizeDocumentTextures(document, typeof OffscreenCanvas !== "undefined");
  const ratio = simplifyRatio(beforeTriangles);
  await document.transform(
    dedup(),
    prune(),
    weld(),
    instance(),
    flatten(),
    ...(ratio ? [simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.01 })] : []),
    meshopt({ encoder: MeshoptEncoder, level: "medium" }),
  );
  return { glb: await io.writeBinary(document), beforeTriangles, afterTriangles: countTriangles(document) };
}

export { getBounds };
