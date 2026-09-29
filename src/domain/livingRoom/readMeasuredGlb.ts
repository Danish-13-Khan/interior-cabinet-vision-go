import type { AssetBlobStore } from "./storedAssets";
import { storeAssetBlob } from "./storedAssets";
import type { ModelTextureUrls } from "./renderAssetContracts";
import { dimensionsForPlacement, defaultGlbSettings, measureGlbImport } from "./modelImportClient";
import type { LengthUnit } from "../../workers/modelImport/protocol";
import { toMillimetres } from "../../workers/modelImport/units";
import type { ImportedAsset } from "./assetImportPipeline";

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
export async function readImportedGlb(files: File | File[], store: AssetBlobStore, unit: LengthUnit = "m"): Promise<ImportedAsset> {
  const all = Array.isArray(files) ? files : [files];
  const file = all.find((item) => item.name.toLowerCase().endsWith(".glb"));
  if (!file) throw new Error("Select one GLB file together with any texture images.");
  if (!file.name.toLowerCase().endsWith(".glb")) {
    throw new Error("Import GLB files only. Convert FBX to GLB first so textures travel with the model.");
  }
  if (file.size > MAX_MODEL_BYTES) throw new Error("Model is larger than 25 MB. Optimize it before importing.");
  const payloads = await Promise.all(all.map(async (item) => ({ name: item.name, bytes: await item.arrayBuffer() })));
  const measured = await measureGlbImport(payloads, defaultGlbSettings(unit));
  const glbBytes = measured.glb ?? payloads.find((item) => item.name === file.name)!.bytes;
  const textureUrls: ModelTextureUrls = {};
  await Promise.all(all.filter((item) => item !== file && item.type.startsWith("image/")).map(async (image) => {
    const slot = textureSlot(image.name);
    if (slot && !textureUrls[slot]) textureUrls[slot] = await storeFile(store, image);
  }));
  return {
    id: measured.assetId,
    name: file.name.replace(/\.glb$/i, ""),
    category: "imported",
    kind: "custom",
    dimensions: dimensionsForPlacement(undefined, measured.dimensions),
    sourceUrl: await storeFile(store, new File([glbBytes], file.name, { type: file.type || "model/gltf-binary" })),
    importUnit: unit,
    rawLargestSide: Math.max(measured.dimensions.widthMm, measured.dimensions.heightMm, measured.dimensions.depthMm) / toMillimetres(1, unit),
    ...(Object.keys(textureUrls).length ? { textureUrls } : {}),
  };
}
