import { assetIdForImport } from "./identity";
import { parseGlb } from "./loaders/gltf";
import { bboxMinY, normalizeImportedObject } from "./normalize";
import { exportSceneGlb } from "./exportGlb";
import type { ImportRequest, ImportResult } from "./protocol";
import { renderThumbnail } from "./thumbnail";
import { probeImportRuntime } from "./spike";
import { toMillimetres } from "./units";

function glbFile(files: ImportRequest["files"]) {
  return files.find((file) => file.name.toLowerCase().endsWith(".glb") || file.name.toLowerCase().endsWith(".gltf"));
}

/** Normalize one GLB. FBX/OBJ loaders join this in phase 3. */
export async function runImport(request: ImportRequest): Promise<ImportResult> {
  const model = glbFile(request.files);
  if (!model) throw new Error("Select one GLB file together with any texture images.");
  const scene = await parseGlb(model.bytes);
  const dimensions = normalizeImportedObject(scene, {
    scaleToMm: toMillimetres(1, request.settings.unit),
    rotateZUp: request.settings.upAxis === "z",
  });
  if (bboxMinY(scene) > 1e-3) throw new Error("Imported model did not sit on the floor.");
  const probe = probeImportRuntime();
  const [glb, thumbnail, assetId] = await Promise.all([
    exportSceneGlb(scene).catch(() => null),
    request.texturesOnMain ? Promise.resolve(null) : renderThumbnail(probe.webpEncode),
    assetIdForImport(request.files, request.settings),
  ]);
  return { glb, dimensions, thumbnail, warnings: [], sourceHash: assetId, assetId };
}
