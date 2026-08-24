import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import type {
  RenderAssetStrategy,
  RenderBinding,
} from "./renderAssetContracts";
import type { CompiledSceneNode } from "./sceneTypes";
import { getPackagedImportedAsset, type ImportedAsset } from "./assetImportPipeline";

/** Soft-goods catalog items intended for future GLB-backed presentation. */
export const GLB_INTENT_CATALOG_IDS = [
  "living:sofa-3-seat",
  "living:sofa-sectional",
  "living:sofa-loveseat",
  "living:lounge-chair",
  "living:accent-chair",
  "living:coffee-table",
  "living:coffee-table-round",
  "living:side-table",
  "living:console-table",
  "living:ottoman",
  "living:floor-lamp",
  "living:indoor-plant",
] as const;

export type GlbIntentCatalogId = (typeof GLB_INTENT_CATALOG_IDS)[number];

const GLB_MODEL_BY_CATALOG: Record<GlbIntentCatalogId, string> = {
  "living:sofa-3-seat": "model:sofa-3-seat",
  "living:sofa-sectional": "model:sofa-sectional",
  "living:sofa-loveseat": "model:sofa-loveseat",
  "living:lounge-chair": "model:lounge-chair",
  "living:accent-chair": "model:accent-chair",
  "living:coffee-table": "model:coffee-table",
  "living:coffee-table-round": "model:coffee-table-round",
  "living:side-table": "model:side-table",
  "living:console-table": "model:console-table",
  "living:ottoman": "model:ottoman",
  "living:floor-lamp": "model:floor-lamp",
  "living:indoor-plant": "model:indoor-plant",
};

const DEFAULT_UV_SCALE_MM = 1000;

const MATERIAL_UV_SCALE_MM: Record<string, number> = {
  [LIVING_ROOM_MATERIAL_IDS.wallPaint]: 2400,
  [LIVING_ROOM_MATERIAL_IDS.ceilingPaint]: 3200,
  [LIVING_ROOM_MATERIAL_IDS.naturalOak]: 900,
  [LIVING_ROOM_MATERIAL_IDS.walnut]: 900,
  [LIVING_ROOM_MATERIAL_IDS.oatmealFabric]: 450,
  [LIVING_ROOM_MATERIAL_IDS.oliveFabric]: 450,
  [LIVING_ROOM_MATERIAL_IDS.charcoalMetal]: 600,
  [LIVING_ROOM_MATERIAL_IDS.clearGlass]: 1200,
  [LIVING_ROOM_MATERIAL_IDS.woolRug]: 1600,
  [LIVING_ROOM_MATERIAL_IDS.warmStone]: 1800,
};

function isGlbIntentCatalogId(id: string): id is GlbIntentCatalogId {
  return id in GLB_MODEL_BY_CATALOG;
}

function importedAssetForObject(object: InteriorObjectEntity): ImportedAsset | null {
  const candidate = object.extensions?.assetImport;
  if (!candidate || typeof candidate !== "object") return null;
  const asset = candidate as Partial<ImportedAsset>;
  if (typeof asset.sourceUrl === "string" && typeof asset.id === "string") return asset as ImportedAsset;
  const packId = typeof (candidate as { id?: unknown }).id === "string" ? (candidate as { id: string }).id : "";
  return getPackagedImportedAsset(packId);
}

export function materialAssetIdForEntity(materialId: string) {
  return materialId;
}

export function defaultUvScaleMmForMaterial(materialId: string) {
  return MATERIAL_UV_SCALE_MM[materialId] ?? DEFAULT_UV_SCALE_MM;
}

export function createObjectRenderBinding(
  object: InteriorObjectEntity,
): RenderBinding {
  const materialBindings: Record<string, string> = {};
  for (const [slot, materialId] of Object.entries(object.materialSlots)) {
    materialBindings[slot] = materialAssetIdForEntity(materialId);
  }
  const uvScaleMm = defaultUvScaleMmForMaterial(
    Object.values(object.materialSlots)[0] ?? LIVING_ROOM_MATERIAL_IDS.naturalOak,
  );

  const imported = importedAssetForObject(object);
  if (imported) {
    return {
      strategy: "glb", modelAssetId: `import:${imported.id}`, modelUrl: imported.sourceUrl,
      modelMaterialGroups: imported.materialGroups, modelTextureUrls: imported.textureUrls, materialBindings, uvScaleMm,
      targetSizeMm: { ...object.dimensions },
    };
  }

  if (object.kind === "cabinet" || !isGlbIntentCatalogId(object.catalogItemId)) {
    return {
      strategy: "procedural",
      materialBindings,
      uvScaleMm,
      targetSizeMm: { ...object.dimensions },
    };
  }

  return {
    strategy: "glb",
    modelAssetId: GLB_MODEL_BY_CATALOG[object.catalogItemId],
    materialBindings,
    uvScaleMm,
    targetSizeMm: { ...object.dimensions },
  };
}

export function createProceduralRenderBinding(
  materialBindings: Record<string, string> = {},
  uvScaleMm = DEFAULT_UV_SCALE_MM,
): RenderBinding {
  return { strategy: "procedural", materialBindings, uvScaleMm };
}

export function expectedStrategyForCatalogItem(
  catalogItemId: string,
): RenderAssetStrategy {
  return isGlbIntentCatalogId(catalogItemId) ? "glb" : "procedural";
}

/** Resolve runtime draw path once the asset registry reports availability. */
export function resolveEffectiveRenderStrategy(
  binding: RenderBinding,
  modelAvailable: boolean,
): RenderAssetStrategy {
  if (binding.strategy === "glb" && binding.modelUrl) return "glb";
  if (binding.strategy === "glb" && binding.modelAssetId && modelAvailable) {
    return "glb";
  }
  return "procedural";
}

export function withRenderBinding(
  node: CompiledSceneNode,
  binding: RenderBinding,
): CompiledSceneNode {
  return { ...node, renderBinding: binding };
}

export function attachObjectRenderBinding(
  node: CompiledSceneNode,
  object: InteriorObjectEntity,
): CompiledSceneNode {
  return withRenderBinding(node, createObjectRenderBinding(object));
}

/** @deprecated Prefer getRenderModeQuality from heroRenderQuality / renderStudio. */
export { getRenderModeQuality } from "./heroRenderQuality";
