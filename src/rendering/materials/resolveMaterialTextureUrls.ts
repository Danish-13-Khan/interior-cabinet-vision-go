import type { CompiledMaterial } from "../../domain/livingRoom";
import {
  getMaterialAsset,
  getTextureAsset,
  resolveTextureAssetUrl,
} from "../assets/assetRegistry";

export type MaterialTextureUrls = {
  map?: string;
  normalMap?: string;
  roughnessMap?: string;
  aoMap?: string;
};

function urlIfAvailable(textureId: string | undefined) {
  if (!textureId) return undefined;
  const texture = getTextureAsset(textureId);
  if (!texture?.available) return undefined;
  return resolveTextureAssetUrl(texture.assetKey);
}

/** Resolve curated file texture URLs for a compiled material; empty when unavailable. */
export function resolveMaterialTextureUrls(
  material: CompiledMaterial,
): MaterialTextureUrls {
  if (material.textureMapUrl) return { map: material.textureMapUrl };
  const asset = getMaterialAsset(material.materialAssetId)
    ?? getMaterialAsset(material.id);
  if (!asset) return {};
  return {
    map: urlIfAvailable(asset.colorMapId),
    normalMap: urlIfAvailable(asset.normalMapId),
    roughnessMap: urlIfAvailable(asset.roughnessMapId),
    aoMap: urlIfAvailable(asset.aoMapId),
  };
}

export function hasCuratedTextureUrls(urls: MaterialTextureUrls) {
  return Boolean(urls.map || urls.normalMap || urls.roughnessMap || urls.aoMap);
}
