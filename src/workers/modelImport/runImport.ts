import { assetIdForImport } from "./identity";
import { loadModel } from "./loaders/loadModel";
import { bboxMinY, normalizeImportedObject } from "./normalize";
import { exportSceneGlb } from "./exportGlb";
import type { ImportRequest, ImportResult } from "./protocol";
import { renderThumbnail } from "./thumbnail";
import { probeImportRuntime } from "./spike";
import { optimizeGlb } from "./optimize";

/** Convert every supported model to one normalized GLB. */
export async function runImport(request: ImportRequest): Promise<ImportResult> {
  const honorFileUnits = request.honorFileUnits !== false;
  const loaded = await loadModel(request.files, request.settings, honorFileUnits);
  const dimensions = normalizeImportedObject(loaded.scene, {
    scaleToMm: loaded.scaleToMm,
    rotateZUp: loaded.rotateZUp,
  });
  if (bboxMinY(loaded.scene) > 1e-2) throw new Error("Imported model did not sit on the floor.");
  const probe = probeImportRuntime();
  const [exported, thumbnail, assetId] = await Promise.all([
    exportSceneGlb(loaded.scene).catch(() => null),
    request.texturesOnMain ? Promise.resolve(null) : renderThumbnail(probe.webpEncode),
    assetIdForImport(request.files, request.settings, {
      honorFileUnits,
      appliedUnit: loaded.appliedUnit,
      scaleToMm: loaded.scaleToMm,
    }),
  ]);
  let glb = exported;
  const warnings = [...loaded.warnings];
  if (glb) {
    try {
      const optimized = await optimizeGlb(glb);
      glb = optimized.glb.buffer.slice(optimized.glb.byteOffset, optimized.glb.byteOffset + optimized.glb.byteLength);
      warnings.push(`${optimized.beforeTriangles} → ${optimized.afterTriangles} triangles`);
    } catch {
      warnings.push("Optimizer skipped; the normalized model was kept.");
    }
  }
  return {
    glb, dimensions, thumbnail, warnings, sourceHash: assetId, assetId,
    appliedUnit: loaded.appliedUnit, scaleToMm: loaded.scaleToMm,
  };
}
