import type { RenderBinding } from "../../domain/livingRoom/renderAssetContracts";
import { resolveEffectiveRenderStrategy } from "../../domain/livingRoom/renderAssetBindings";
import type {
  EnvironmentAssetDefinition,
  MaterialAssetDefinition,
  ModelAssetDefinition,
  TextureAssetDefinition,
} from "../../domain/livingRoom/renderAssetContracts";
import { ENVIRONMENT_ASSET_MANIFEST } from "./environmentManifest";
import { MATERIAL_ASSET_MANIFEST } from "./materialManifest";
import { MODEL_ASSET_MANIFEST } from "./modelManifest";
import { TEXTURE_ASSET_MANIFEST } from "./textureManifest";

const models = new Map<string, ModelAssetDefinition>(
  MODEL_ASSET_MANIFEST.map((asset) => [asset.id, asset]),
);
const textures = new Map<string, TextureAssetDefinition>(
  TEXTURE_ASSET_MANIFEST.map((asset) => [asset.id, asset]),
);
const materials = new Map<string, MaterialAssetDefinition>(
  MATERIAL_ASSET_MANIFEST.map((asset) => [asset.id, asset]),
);
const environments = new Map<string, EnvironmentAssetDefinition>(
  ENVIRONMENT_ASSET_MANIFEST.map((asset) => [asset.id, asset]),
);

export function getModelAsset(id: string) {
  return models.get(id) ?? null;
}

export function getTextureAsset(id: string) {
  return textures.get(id) ?? null;
}

export function getMaterialAsset(id: string) {
  return materials.get(id) ?? null;
}

export function getEnvironmentAsset(id: string) {
  return environments.get(id) ?? null;
}

export function getEnvironmentForLightingRecipe(recipeId: string) {
  return ENVIRONMENT_ASSET_MANIFEST.find((asset) => asset.lightingRecipeId === recipeId) ?? null;
}

export function isModelAssetAvailable(id: string | undefined) {
  if (!id) return false;
  return getModelAsset(id)?.available === true;
}

/** Public URL for a registry assetKey (Vite/Tauri static files under /public). */
export function resolveModelAssetUrl(assetKey: string) {
  const normalized = assetKey.replace(/^\/+/, "");
  return `/${normalized}`;
}

export function resolveNodeDrawStrategy(binding: RenderBinding) {
  return resolveEffectiveRenderStrategy(
    binding,
    isModelAssetAvailable(binding.modelAssetId),
  );
}

export function listMaterialAssets() {
  return [...MATERIAL_ASSET_MANIFEST];
}

export function listModelAssets() {
  return [...MODEL_ASSET_MANIFEST];
}

export function listAvailableModelAssets() {
  return MODEL_ASSET_MANIFEST.filter((asset) => asset.available);
}
