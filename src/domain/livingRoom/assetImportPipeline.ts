import type { InteriorObjectEntity, Point3Mm, Size3Mm } from "../interiorProject";
import { PACK_STARTER_ALIASES } from "../catalog/aliases";
import { resolvePackStarterAlias } from "../catalog/compatibility";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import type { ModelTextureUrls } from "./renderAssetContracts";
import { storeAssetBlob, type AssetBlobStore } from "./storedAssets";

export type ImportedAsset = {
  id: string;
  name: string;
  category: string;
  kind: InteriorObjectEntity["kind"];
  dimensions: Size3Mm;
  sourceUrl: string;
  materialGroups?: Record<string, string>;
  textureUrls?: ModelTextureUrls;
};

/** Historical pack footprints preserved so old layouts and pack UI stay familiar. */
const PACK_STARTER_META: Record<
  string,
  { name: string; category: string; kind: InteriorObjectEntity["kind"]; dimensions: Size3Mm }
> = {
  "pack:wardrobe-1": {
    name: "Imported Wardrobe",
    category: "wardrobe",
    kind: "cabinet",
    dimensions: { widthMm: 1800, heightMm: 2200, depthMm: 600 },
  },
  "pack:dresser-1": {
    name: "Imported Dresser",
    category: "dresser",
    kind: "cabinet",
    dimensions: { widthMm: 1400, heightMm: 820, depthMm: 480 },
  },
  "pack:kitchen-cabinet-1": {
    name: "Imported Kitchen Cabinet",
    category: "kitchen",
    kind: "cabinet",
    dimensions: { widthMm: 900, heightMm: 900, depthMm: 600 },
  },
  "pack:sofa-1": {
    name: "Imported Sofa",
    category: "sofa",
    kind: "furniture",
    dimensions: { widthMm: 2200, heightMm: 850, depthMm: 920 },
  },
};

function buildPackStarterAsset(aliasId: string): ImportedAsset {
  const meta = PACK_STARTER_META[aliasId];
  const resolved = resolvePackStarterAlias(aliasId);
  if (!meta || !resolved) {
    throw new Error(`Missing catalog alias for packaged starter ${aliasId}`);
  }
  return {
    id: aliasId,
    name: meta.name,
    category: meta.category,
    kind: meta.kind,
    dimensions: { ...meta.dimensions },
    sourceUrl: resolved.modelUrl,
  };
}

export const ASSET_IMPORT_STARTER_PACK: readonly ImportedAsset[] =
  PACK_STARTER_ALIASES.map((alias) => buildPackStarterAsset(alias.aliasId));

const MAX_MODEL_BYTES = 25 * 1024 * 1024;

export function getPackagedImportedAsset(id: string) {
  return ASSET_IMPORT_STARTER_PACK.find((asset) => asset.id === id) ?? null;
}

export function createImportedAssetObject(
  asset: ImportedAsset,
  id: string,
  roomId: string,
  position: Point3Mm,
): InteriorObjectEntity {
  const persistedAsset = getPackagedImportedAsset(asset.id) ? { id: asset.id } : asset;
  return {
    id,
    roomId,
    kind: asset.kind,
    category: asset.category,
    catalogItemId: `imported:${asset.id}`,
    name: asset.name,
    position,
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { ...asset.dimensions },
    materialSlots: {
      carcass: LIVING_ROOM_MATERIAL_IDS.naturalOak,
      fronts: LIVING_ROOM_MATERIAL_IDS.walnut,
    },
    parameters: {},
    extensions: { placement: "floor", assetImport: persistedAsset },
  };
}

async function storeFile(store: AssetBlobStore, file: File): Promise<string> {
  try {
    return await storeAssetBlob(store, file);
  } catch (error) {
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

/**
 * Store a GLB and any sidecar texture images in the blob store (IndexedDB in the app).
 * The project document keeps only `idb:` references; project files embed the bytes on save.
 */
export async function readImportedGlb(files: File | File[], store: AssetBlobStore): Promise<ImportedAsset> {
  const all = Array.isArray(files) ? files : [files];
  const file = all.find((item) => item.name.toLowerCase().endsWith(".glb"));
  if (!file) throw new Error("Select one GLB file together with any texture images.");
  if (!file.name.toLowerCase().endsWith(".glb")) {
    throw new Error("Import GLB files only. Convert FBX to GLB first so textures travel with the model.");
  }
  if (file.size > MAX_MODEL_BYTES) throw new Error("Model is larger than 25 MB. Optimize it before importing.");
  const textureUrls: ModelTextureUrls = {};
  await Promise.all(
    all
      .filter((item) => item !== file && item.type.startsWith("image/"))
      .map(async (image) => {
        const slot = textureSlot(image.name);
        if (slot && !textureUrls[slot]) textureUrls[slot] = await storeFile(store, image);
      }),
  );
  return {
    id: `file:${file.name}-${file.size}`,
    name: file.name.replace(/\.glb$/i, ""),
    category: "imported",
    kind: "custom",
    dimensions: { widthMm: 1000, heightMm: 1000, depthMm: 1000 },
    sourceUrl: await storeFile(store, file),
    ...(Object.keys(textureUrls).length ? { textureUrls } : {}),
  };
}
