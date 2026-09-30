import type { AssetBlobStore } from "./storedAssets";
import { storeAssetBlob } from "./storedAssets";
import type { ModelTextureUrls } from "./renderAssetContracts";
import { dimensionsForPlacement, defaultGlbSettings, measureGlbImport } from "./modelImportClient";
import type { LengthUnit } from "../../workers/modelImport/protocol";
import type { ImportedAsset } from "./assetImportPipeline";
import { extensionOf, unsupportedImportMessage } from "../../workers/modelImport/messages";

const MAX_RAW_MODEL_BYTES = 150 * 1024 * 1024;
const MAX_OPTIMIZED_GLB_BYTES = 25 * 1024 * 1024;

async function storeFile(store: AssetBlobStore, file: File): Promise<string> {
  try { return await storeAssetBlob(store, file); }
  catch (error) {
    const reason = error instanceof Error ? error.message : "storage failed";
    throw new Error(`Could not store ${file.name} in this browser (${reason}).`);
  }
}

function textureSlot(name: string): keyof ModelTextureUrls | null {
  const normalized = name.toLowerCase();
  if (/(base.?color|albedo|diffuse|color)/.test(normalized)) return "map";
  if (/normal/.test(normalized)) return "normalMap";
  if (/roughness/.test(normalized)) return "roughnessMap";
  if (/(metallic|metalness)/.test(normalized)) return "metalnessMap";
  return null;
}

function requireOptimizedGlb(glb: ArrayBuffer | null): ArrayBuffer {
  if (!glb) throw new Error("Could not convert the model to GLB.");
  if (glb.byteLength > MAX_OPTIMIZED_GLB_BYTES) throw new Error("Optimized model is larger than 25 MB.");
  return glb;
}

/** New imports use the measured bounding box. Changing `unit` re-runs the pipeline. */
export async function readImportedGlb(
  files: File | File[],
  store: AssetBlobStore,
  unit: LengthUnit = "m",
  honorFileUnits = true,
  signal?: AbortSignal,
): Promise<ImportedAsset> {
  const all = Array.isArray(files) ? files : [files];
  for (const item of all) {
    const rejected = unsupportedImportMessage(item.name);
    if (rejected) throw new Error(rejected);
  }
  const file = all.find((item) => ["glb", "gltf", "fbx", "obj"].includes(extensionOf(item.name)));
  if (!file) throw new Error("Select a GLB, FBX, or OBJ file.");
  if (signal?.aborted) throw new DOMException("Import cancelled", "AbortError");
  if (file.size > MAX_RAW_MODEL_BYTES) throw new Error("Model is larger than 150 MB.");
  const payloads = await Promise.all(all.map(async (item) => ({ name: item.name, bytes: await item.arrayBuffer() })));
  const measured = await measureGlbImport(payloads, defaultGlbSettings(unit), honorFileUnits, signal);
  const glbBytes = requireOptimizedGlb(measured.glb);
  const textureUrls: ModelTextureUrls = {};
  await Promise.all(all.filter((item) => item !== file && item.type.startsWith("image/")).map(async (image) => {
    const slot = textureSlot(image.name);
    if (slot && !textureUrls[slot]) textureUrls[slot] = await storeFile(store, image);
  }));
  const largestMm = Math.max(measured.dimensions.widthMm, measured.dimensions.heightMm, measured.dimensions.depthMm);
  return {
    id: measured.assetId,
    name: file.name.replace(/\.(glb|gltf|fbx|obj)$/i, ""),
    category: "imported",
    kind: "custom",
    dimensions: dimensionsForPlacement(undefined, measured.dimensions),
    sourceUrl: await storeFile(store, new File([glbBytes], file.name, { type: "model/gltf-binary" })),
    importUnit: measured.appliedUnit ?? undefined,
    importWarnings: measured.warnings,
    rawLargestSide: largestMm / measured.scaleToMm,
    scaleToMm: measured.scaleToMm,
    ...(Object.keys(textureUrls).length ? { textureUrls } : {}),
  };
}
