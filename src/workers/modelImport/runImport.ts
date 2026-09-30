import { assetIdForImport } from "./identity";
import { loadModel } from "./loaders/loadModel";
import { bboxMinY, normalizeImportedObject } from "./normalize";
import { exportSceneGlb } from "./exportGlb";
import type { ImportRequest, ImportResult } from "./protocol";
import { optimizeGlb } from "./optimize";
import { stripUnloadedTextures } from "./stripUnloadedTextures";

/** Convert every supported model to one normalized GLB. */
export async function runImport(request: ImportRequest): Promise<ImportResult> {
  if (request.signal?.aborted) throw new DOMException("Import cancelled", "AbortError");
  const honorFileUnits = request.honorFileUnits !== false;
  const loaded = await loadModel(request.files, request.settings, honorFileUnits);
  if (request.signal?.aborted) throw new DOMException("Import cancelled", "AbortError");
  const dimensions = normalizeImportedObject(loaded.scene, {
    scaleToMm: loaded.scaleToMm,
    rotateZUp: loaded.rotateZUp,
  });
  if (bboxMinY(loaded.scene) > 1e-2) throw new Error("Imported model did not sit on the floor.");
  // Missing textures are warnings (already reported by the loaders), never a failed export.
  const clearedTextures = stripUnloadedTextures(loaded.scene);
  const [exported, assetId] = await Promise.all([
    exportSceneGlb(loaded.scene).catch(() => null),
    assetIdForImport(request.files, request.settings, {
      honorFileUnits,
      appliedUnit: loaded.appliedUnit,
      scaleToMm: loaded.scaleToMm,
    }),
  ]);
  let glb = exported;
  const warnings = [...loaded.warnings];
  if (clearedTextures > 0 && loaded.warnings.length === 0) {
    warnings.push(`${clearedTextures} texture${clearedTextures === 1 ? "" : "s"} could not be loaded and were left off.`);
  }
  if (glb && !request.signal?.aborted) {
    try {
      const optimized = await optimizeGlb(glb);
      glb = optimized.glb.buffer.slice(optimized.glb.byteOffset, optimized.glb.byteOffset + optimized.glb.byteLength);
      warnings.push(`${optimized.beforeTriangles} → ${optimized.afterTriangles} triangles`);
    } catch {
      warnings.push("Optimizer skipped; the normalized model was kept.");
    }
  }
  return {
    glb, dimensions, thumbnail: null, warnings, sourceHash: assetId, assetId,
    appliedUnit: loaded.appliedUnit, scaleToMm: loaded.scaleToMm,
  };
}
