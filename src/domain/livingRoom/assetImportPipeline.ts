import type { InteriorObjectEntity, Point3Mm, Size3Mm } from "../interiorProject";
import { PACK_STARTER_ALIASES } from "../catalog/aliases";
import { resolvePackStarterAlias } from "../catalog/compatibility";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import type { ModelTextureUrls } from "./renderAssetContracts";

export type ImportedAsset = {
  id: string;
  name: string;
  category: string;
  kind: InteriorObjectEntity["kind"];
  dimensions: Size3Mm;
  sourceUrl: string;
  materialGroups?: Record<string, string>;
  textureUrls?: ModelTextureUrls;
  /** Unit confirmed for this new import. Saved placements are not resized. */
  importUnit?: "mm" | "cm" | "m" | "in" | "ft";
  /** Millimetres per file unit. Set so a custom FBX scale is not shown as metres. */
  scaleToMm?: number;
  /** Largest side in file units, so the dialog can show every candidate. */
  rawLargestSide?: number;
  importWarnings?: string[];
  /** Up axis chosen in the import dialog. FBX files set their own. */
  importUpAxis?: "y" | "z";
  /** Import dialog preview only (data: URL). Never written into the project document. */
  thumbnailUrl?: string;
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

export function getPackagedImportedAsset(id: string) {
  return ASSET_IMPORT_STARTER_PACK.find((asset) => asset.id === id) ?? null;
}

export function createImportedAssetObject(
  asset: ImportedAsset,
  id: string,
  roomId: string,
  position: Point3Mm,
): InteriorObjectEntity {
  const { thumbnailUrl: _preview, ...stored } = asset;
  const persistedAsset = getPackagedImportedAsset(asset.id) ? { id: asset.id } : stored;
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

export type { LengthUnit } from "../../workers/modelImport/protocol";
export { readImportedGlb } from "./readMeasuredGlb";
