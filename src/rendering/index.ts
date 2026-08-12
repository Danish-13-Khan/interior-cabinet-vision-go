export {
  getEnvironmentAsset,
  getEnvironmentForLightingRecipe,
  getMaterialAsset,
  getModelAsset,
  getTextureAsset,
  isModelAssetAvailable,
  listAvailableModelAssets,
  listMaterialAssets,
  listModelAssets,
  resolveModelAssetUrl,
  resolveNodeDrawStrategy,
} from "./assets/assetRegistry";
export { ENVIRONMENT_ASSET_MANIFEST } from "./assets/environmentManifest";
export { MATERIAL_ASSET_MANIFEST } from "./assets/materialManifest";
export { MODEL_ASSET_MANIFEST } from "./assets/modelManifest";
export { TEXTURE_ASSET_MANIFEST } from "./assets/textureManifest";
export {
  createPbrMaterialDescriptor,
  type PbrMaterialDescriptor,
} from "./materials/createPbrMaterial";
export { applyGlbSlotMaterials } from "./materials/applyGlbSlotMaterials";
export {
  anisotropyForRenderMode,
  bumpScaleForRenderMode,
  envIntensityForRenderMode,
  textureRepeatFromUvScaleMm,
} from "./materials/materialScale";
export { createProceduralSurfaceMaps } from "./materials/proceduralSurfaceMaps";
export { measureObjectSizeMeters } from "./loaders/measureObjectBounds";
export { useModelAsset, type ModelAssetState } from "./loaders/useModelAsset";
export { usePbrMaterial } from "./loaders/usePbrMaterial";
