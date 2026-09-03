/**
 * Inspect a Kenney (or other) GLB: bounds, primitives, materials.
 * Usage: node scripts/catalog/inspect-glb.mjs path/to/file.glb
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { installGlbPolyfills } from "./lib/polyfills.mjs";

installGlbPolyfills();

function parseGlb(absolutePath) {
  return new Promise((resolvePromise, reject) => {
    const buf = readFileSync(absolutePath);
    const loader = new GLTFLoader();
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    loader.parse(
      ab,
      "",
      (gltf) => resolvePromise(gltf),
      (error) => reject(error),
    );
  });
}

/** @returns {Promise<{ nativeBoundsM, primitiveCount, triangleCount, originalMaterialNames, warnings }>} */
export async function inspectGlb(absolutePath) {
  const warnings = [];
  let gltf;
  try {
    gltf = await parseGlb(absolutePath);
  } catch (error) {
    return {
      nativeBoundsM: { width: 0, height: 0, depth: 0 },
      primitiveCount: 0,
      triangleCount: 0,
      originalMaterialNames: [],
      warnings: [`parse-failed: ${error instanceof Error ? error.message : String(error)}`],
    };
  }

  const materials = new Set();
  let primitiveCount = 0;
  let triangleCount = 0;
  gltf.scene.traverse((object) => {
    if (!object.isMesh) return;
    primitiveCount += 1;
    const geometry = object.geometry;
    if (geometry?.index) triangleCount += geometry.index.count / 3;
    else if (geometry?.attributes?.position) {
      triangleCount += geometry.attributes.position.count / 3;
    }
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    for (const mat of mats) {
      if (mat?.name) materials.add(mat.name);
      else warnings.push("unnamed-material");
    }
  });

  const box = new Box3().setFromObject(gltf.scene);
  const size = new Vector3();
  box.getSize(size);
  if (primitiveCount < 1) warnings.push("no-primitives");
  if (!(size.x > 0 && size.y > 0 && size.z > 0)) warnings.push("zero-bounds");

  return {
    nativeBoundsM: {
      width: Number(size.x.toFixed(6)),
      height: Number(size.y.toFixed(6)),
      depth: Number(size.z.toFixed(6)),
    },
    primitiveCount,
    triangleCount: Math.round(triangleCount),
    originalMaterialNames: [...materials].sort(),
    warnings: [...new Set(warnings)],
  };
}

if (process.argv[1]?.endsWith("inspect-glb.mjs") && process.argv[2]) {
  const path = resolve(process.argv[2]);
  const result = await inspectGlb(path);
  console.log(JSON.stringify(result, null, 2));
}
