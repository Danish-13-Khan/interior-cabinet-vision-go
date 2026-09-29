import type { AssetBlobStore } from "./storedAssets";
import { storeAssetBlob } from "./storedAssets";
import type { ModelTextureUrls } from "./renderAssetContracts";
import { dimensionsForPlacement, defaultGlbSettings, measureGlbImport } from "./modelImportClient";
import type { LengthUnit } from "../../workers/modelImport/protocol";
import { toMillimetres } from "../../workers/modelImport/units";
import type { ImportedAsset } from "./assetImportPipeline";
import { extensionOf, unsupportedImportMessage } from "../../workers/modelImport/messages";

const MAX_MODEL_BYTES = 25 * 1024 * 1024;

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

/** New imports use the measured bounding box. Changing `unit` re-runs the pipeline. */
export async function readImportedGlb(
  files: File | File[],
  store: AssetBlobStore,
  unit: LengthUnit = "m",
  honorFileUnits = true,
): Promise<ImportedAsset> {
  const all = Array.isArray(files) ? files : [files];
  for (const item of all) {
    const rejected = unsupportedImportMessage(item.name);
    if (rejected) throw new Error(rejected);
  }
  const file = all.find((item) => ["glb", "gltf", "fbx", "obj"].includes(extensionOf(item.name)));
  if (!file) throw new Error("Select a GLB, FBX, or OBJ file.");
  if (file.size > MAX_MODEL_BYTES) throw new Error("Model is larger than 25 MB. Optimize it before importing.");
  const payloads = await Promise.all(all.map(async (item) => ({ name: item.name, bytes: await item.arrayBuffer() })));
  const measured = await measureGlbImport(payloads, defaultGlbSettings(unit), honorFileUnits);
  const glbBytes = measured.glb ?? payloads.find((item) => item.name === file.name)!.bytes;
  const textureUrls: ModelTextureUrls = {};
  await Promise.all(all.filter((item) => item !== file && item.type.startsWith("image/")).map(async (image) => {
    const slot = textureSlot(image.name);
    if (slot && !textureUrls[slot]) textureUrls[slot] = await storeFile(store, image);
  }));
  return {
    id: measured.assetId,
    name: file.name.replace(/\.(glb|gltf|fbx|obj)$/i, ""),
    category: "imported",
    kind: "custom",
    dimensions: dimensionsForPlacement(undefined, measured.dimensions),
    sourceUrl: await storeFile(store, new File([glbBytes], file.name, { type: file.type || "model/gltf-binary" })),
    importUnit: unit,
    importWarnings: measured.warnings,
    rawLargestSide: Math.max(measured.dimensions.widthMm, measured.dimensions.heightMm, measured.dimensions.depthMm) / toMillimetres(1, unit),
    ...(Object.keys(textureUrls).length ? { textureUrls } : {}),
  };
}
