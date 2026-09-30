import { WebIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, flatten, getBounds, instance, meshopt, prune, simplify, weld } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { resizeDocumentTextures } from "./textureResize";
import { canEncodeWebp } from "./spike";

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

/** Keeps KHR_materials_* and KHR_texture_transform instead of dropping unregistered extensions. */
export function createOptimizeIO(): WebIO {
  return new WebIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
}

export async function optimizeGlb(bytes: ArrayBuffer): Promise<{ glb: Uint8Array; beforeTriangles: number; afterTriangles: number }> {
  await MeshoptEncoder.ready;
  await MeshoptSimplifier.ready;
  const io = createOptimizeIO();
  const document = await io.readBinary(new Uint8Array(bytes));
  const beforeTriangles = countTriangles(document);
  await resizeDocumentTextures(document, await canEncodeWebp());
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
