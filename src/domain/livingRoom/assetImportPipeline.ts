import type { InteriorObjectEntity, Point3Mm, Size3Mm } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";

const wardrobeUrl = new URL("../../fbx_with_texture/wardrobes/wardrobe1/wardrobe1.glb", import.meta.url).href;
const dresserUrl = new URL("../../fbx_with_texture/dressers and cabinets/dresser/dresser.glb", import.meta.url).href;
const kitchenCabinetUrl = new URL("../../fbx_with_texture/Kitchen/Cabinet1/KitchenCabinet1.glb", import.meta.url).href;
const sofaUrl = new URL("../../fbx_with_texture/sofas/sofa/sofa.glb", import.meta.url).href;

export type ImportedAsset = {
  id: string;
  name: string;
  category: string;
  kind: InteriorObjectEntity["kind"];
  dimensions: Size3Mm;
  sourceUrl: string;
  materialGroups?: Record<string, string>;
};

export const ASSET_IMPORT_STARTER_PACK: readonly ImportedAsset[] = [
  { id: "pack:wardrobe-1", name: "Imported Wardrobe", category: "wardrobe", kind: "cabinet", dimensions: { widthMm: 1800, heightMm: 2200, depthMm: 600 }, sourceUrl: wardrobeUrl, materialGroups: { carcass: "cabinet", fronts: "door" } },
  { id: "pack:dresser-1", name: "Imported Dresser", category: "dresser", kind: "cabinet", dimensions: { widthMm: 1400, heightMm: 820, depthMm: 480 }, sourceUrl: dresserUrl, materialGroups: { carcass: "body", fronts: "drawer" } },
  { id: "pack:kitchen-cabinet-1", name: "Imported Kitchen Cabinet", category: "kitchen", kind: "cabinet", dimensions: { widthMm: 900, heightMm: 900, depthMm: 600 }, sourceUrl: kitchenCabinetUrl, materialGroups: { carcass: "cabinet", fronts: "drawer" } },
  { id: "pack:sofa-1", name: "Imported Sofa", category: "sofa", kind: "furniture", dimensions: { widthMm: 2200, heightMm: 850, depthMm: 920 }, sourceUrl: sofaUrl, materialGroups: { upholstery: "sofa", legs: "leg" } },
] as const;

const MAX_MODEL_BYTES = 25 * 1024 * 1024;

export function getPackagedImportedAsset(id: string) {
  return ASSET_IMPORT_STARTER_PACK.find((asset) => asset.id === id) ?? null;
}

export function createImportedAssetObject(asset: ImportedAsset, id: string, roomId: string, position: Point3Mm): InteriorObjectEntity {
  const persistedAsset = getPackagedImportedAsset(asset.id) ? { id: asset.id } : asset;
  return {
    id, roomId, kind: asset.kind, category: asset.category, catalogItemId: `imported:${asset.id}`,
    name: asset.name, position, rotation: { x: 0, y: 0, z: 0 }, dimensions: { ...asset.dimensions },
    materialSlots: { carcass: LIVING_ROOM_MATERIAL_IDS.naturalOak, fronts: LIVING_ROOM_MATERIAL_IDS.walnut },
    parameters: {}, extensions: { placement: "floor", assetImport: persistedAsset },
  };
}

export function readImportedGlb(file: File): Promise<ImportedAsset> {
  if (!file.name.toLowerCase().endsWith(".glb")) {
    return Promise.reject(new Error("Import GLB files only. Convert FBX to GLB first so textures travel with the model."));
  }
  if (file.size > MAX_MODEL_BYTES) return Promise.reject(new Error("Model is larger than 25 MB. Optimize it before importing."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected GLB could not be read."));
    reader.onload = () => resolve({
      id: `file:${file.name}-${file.size}`, name: file.name.replace(/\.glb$/i, ""), category: "imported",
      kind: "custom", dimensions: { widthMm: 1000, heightMm: 1000, depthMm: 1000 }, sourceUrl: String(reader.result ?? ""),
    });
    reader.readAsDataURL(file);
  });
}
