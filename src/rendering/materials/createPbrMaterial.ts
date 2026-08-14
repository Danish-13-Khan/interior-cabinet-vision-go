import type { CompiledMaterial } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import {
  applyMaterialContrastRoughness,
  resolveMaterialContrast,
} from "../../domain/livingRoom/materialContrast";
import type {
  MaterialAssetDefinition,
  RenderMode,
} from "../../domain/livingRoom/renderAssetContracts";
import { getMaterialAsset } from "../assets/assetRegistry";
import {
  bumpScaleForRenderMode,
  clearcoatForRenderMode,
  envIntensityForRenderMode,
  roughnessForRenderMode,
  sheenForRenderMode,
  specularForRenderMode,
} from "./materialScale";
import {
  createProceduralSurfaceMaps,
  type ProceduralSurfaceMaps,
} from "./proceduralSurfaceMaps";

export type PbrMaterialDescriptor = {
  asset: MaterialAssetDefinition | null;
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  transmission: number;
  thickness: number;
  ior: number;
  clearcoat: number;
  clearcoatRoughness: number;
  sheen: number;
  sheenColor: string;
  sheenRoughness: number;
  envMapIntensity: number;
  specularIntensity: number;
  maps: ProceduralSurfaceMaps;
  bumpScale: number;
};

function resolveAsset(
  material: CompiledMaterial,
): MaterialAssetDefinition | null {
  return getMaterialAsset(material.materialAssetId)
    ?? getMaterialAsset(material.id);
}

/** Build a renderer-facing PBR descriptor from compiled material + asset spine. */
export function createPbrMaterialDescriptor(
  material: CompiledMaterial,
  mode: RenderMode,
  options?: { primitiveId?: string; quality?: RenderQuality },
): PbrMaterialDescriptor {
  const quality = options?.quality;
  const asset = resolveAsset(material);
  const color = material.color || asset?.baseColor || "#cccccc";
  const roughness = material.roughness ?? asset?.roughness ?? 0.7;
  const metalness = material.metalness ?? asset?.metalness ?? 0;
  const opacity = material.opacity ?? asset?.opacity ?? 1;
  const kind = material.kind ?? asset?.kind ?? "custom";
  const contrast = resolveMaterialContrast(kind, mode, quality);
  const isGlass = kind === "glass";
  const isFabric = kind === "fabric";
  const isWood = kind === "wood" || kind === "laminate";
  const isMetal = kind === "metal";
  const isMirror = options?.primitiveId === "mirror";
  const maps = createProceduralSurfaceMaps(
    {
      ...material,
      uvScaleMm: material.uvScaleMm || asset?.uvScaleMm || 1000,
    },
    mode,
    quality,
  );
  const baseEnv = isMirror ? 2 : isMetal ? 1.35 : isGlass ? 1.1 : isWood ? 0.86 : isFabric ? 0.4 : 0.46;
  const baseClearcoat = isWood ? 0.26 : kind === "paint" ? 0.04 : 0;
  const baseSheen = isFabric ? 0.78 : 0;
  const baseSpecular = isFabric ? 0.3 : isWood ? 0.54 : 1;
  const modeRoughness = isMirror ? 0.08 : roughnessForRenderMode(mode, roughness, quality);
  const tunedRoughness = isMirror
    ? 0.08
    : applyMaterialContrastRoughness(modeRoughness, contrast);
  return {
    asset,
    color,
    roughness: tunedRoughness,
    metalness: isMirror ? 0.82 : metalness,
    opacity: isMirror ? 1 : isGlass ? Math.max(0.42, opacity) : opacity,
    transparent: isMirror ? false : opacity < 1 || isGlass,
    depthWrite: isMirror || !(opacity < 1 || isGlass),
    transmission: isMirror ? 0 : isGlass ? 0.72 : 0,
    thickness: isGlass ? 0.018 : 0,
    ior: isGlass ? 1.5 : 1.45,
    clearcoat: clearcoatForRenderMode(mode, baseClearcoat, quality) * contrast.clearcoatBoost,
    clearcoatRoughness: isWood ? (mode === "hero" ? 0.38 : 0.5) : 0.78,
    sheen: sheenForRenderMode(mode, baseSheen, quality) * contrast.sheenBoost,
    sheenColor: isFabric ? color : "#000000",
    sheenRoughness: isFabric ? (mode === "hero" ? 0.7 : 0.82) : 1,
    envMapIntensity: envIntensityForRenderMode(mode, baseEnv, quality) * contrast.envBoost,
    specularIntensity: specularForRenderMode(mode, baseSpecular, quality) * contrast.specularBoost,
    maps,
    bumpScale: bumpScaleForRenderMode(mode, maps.bumpScale ?? 0.008, quality) * contrast.bumpBoost,
  };
}
