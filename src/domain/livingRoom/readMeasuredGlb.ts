import type { AssetBlobStore } from "./storedAssets";
import { storeAssetBlob } from "./storedAssets";
import type { ModelTextureUrls } from "./renderAssetContracts";
import { dimensionsForPlacement, defaultGlbSettings, measureGlbImport } from "./modelImportClient";
import type { LengthUnit, UpAxis } from "../../workers/modelImport/protocol";
import type { ImportedAsset } from "./assetImportPipeline";
import { extensionOf, unsupportedImportMessage } from "../../workers/modelImport/messages";

const MAX_RAW_MODEL_BYTES = 150 * 1024 * 1024;
const MAX_OPTIMIZED_GLB_BYTES = 25 * 1024 * 1024;

function throwIfCancelled(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Import cancelled", "AbortError");
}

/** A cancelled import must not leave blobs behind, so check right before every write. */
async function storeFile(store: AssetBlobStore, file: File, signal?: AbortSignal): Promise<string> {
  throwIfCancelled(signal);
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

/** Lazy so three's renderer is only loaded once a model has imported. Failure means no thumbnail. */
async function importThumbnail(glb: ArrayBuffer): Promise<string | null> {
  try {
    const { renderModelThumbnail } = await import("../../workers/modelImport/thumbnail");
    return await renderModelThumbnail(glb);
  } catch {
    return null;
  }
}

function requireOptimizedGlb(glb: ArrayBuffer | null): ArrayBuffer {
  if (!glb) throw new Error("Could not convert the model to GLB.");
  if (glb.byteLength > MAX_OPTIMIZED_GLB_BYTES) throw new Error("Optimized model is larger than 25 MB.");
  return glb;
}

/** New imports use the measured bounding box. Changing `unit` or `upAxis` re-runs the pipeline. */
export async function readImportedGlb(
  files: File | File[],
  store: AssetBlobStore,
  unit: LengthUnit = "m",
  honorFileUnits = true,
  signal?: AbortSignal,
  upAxis: UpAxis = "y",
): Promise<ImportedAsset> {
  const all = Array.isArray(files) ? files : [files];
  for (const item of all) {
    const rejected = unsupportedImportMessage(item.name);
    if (rejected) throw new Error(rejected);
  }
  const file = all.find((item) => ["glb", "gltf", "fbx", "obj"].includes(extensionOf(item.name)));
  if (!file) throw new Error("Select a GLB, FBX, or OBJ file.");
  throwIfCancelled(signal);
  if (file.size > MAX_RAW_MODEL_BYTES) throw new Error("Model is larger than 150 MB.");
  const payloads = await Promise.all(all.map(async (item) => ({ name: item.name, bytes: await item.arrayBuffer() })));
  const measured = await measureGlbImport(payloads, defaultGlbSettings(unit, upAxis), honorFileUnits, signal);
  throwIfCancelled(signal);
  const glbBytes = requireOptimizedGlb(measured.glb);
  const thumbnailUrl = await importThumbnail(glbBytes);
  throwIfCancelled(signal);
  const textureUrls: ModelTextureUrls = {};
  await Promise.all(all.filter((item) => item !== file && item.type.startsWith("image/")).map(async (image) => {
    const slot = textureSlot(image.name);
    if (slot && !textureUrls[slot]) textureUrls[slot] = await storeFile(store, image, signal);
  }));
  const sourceUrl = await storeFile(store, new File([glbBytes], file.name, { type: "model/gltf-binary" }), signal);
  const largestMm = Math.max(measured.dimensions.widthMm, measured.dimensions.heightMm, measured.dimensions.depthMm);
  return {
    id: measured.assetId,
    name: file.name.replace(/\.(glb|gltf|fbx|obj)$/i, ""),
    category: "imported",
    kind: "custom",
    dimensions: dimensionsForPlacement(undefined, measured.dimensions),
    sourceUrl,
    importUnit: measured.appliedUnit ?? undefined,
    importWarnings: measured.warnings,
    rawLargestSide: largestMm / measured.scaleToMm,
    scaleToMm: measured.scaleToMm,
    importUpAxis: upAxis,
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
    ...(Object.keys(textureUrls).length ? { textureUrls } : {}),
  };
}
