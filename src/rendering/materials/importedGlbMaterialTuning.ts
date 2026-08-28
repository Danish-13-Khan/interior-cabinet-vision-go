import {
  applyMaterialContrastRoughness,
  resolveMaterialContrast,
} from "../../domain/livingRoom/materialContrast";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import type { GlbMaterialBuildContext } from "./applyGlbSlotMaterials";
import {
  envIntensityForRenderMode,
  roughnessForRenderMode,
  specularForRenderMode,
} from "./materialScale";

const BASE_ROUGHNESS = 0.62;
const BASE_ENV = 0.46;
const BASE_SPECULAR = 1;

export type ImportedGlbMaterialResponse = {
  roughness: number;
  envMapIntensity: number;
  specularIntensity: number;
};

/** Preview-profile PBR response for user-imported GLBs without slot bindings. */
export function resolveImportedGlbMaterialResponse(
  mode: RenderMode,
  build: GlbMaterialBuildContext,
): ImportedGlbMaterialResponse {
  const contrast = resolveMaterialContrast("custom", mode, build.quality, build.modelViewPreview);
  return {
    roughness: applyMaterialContrastRoughness(
      roughnessForRenderMode(mode, BASE_ROUGHNESS, build.quality, build.modeQuality),
      contrast,
    ),
    envMapIntensity: envIntensityForRenderMode(mode, BASE_ENV, build.quality, build.modeQuality)
      * contrast.envBoost,
    specularIntensity: specularForRenderMode(mode, BASE_SPECULAR, build.quality, build.modeQuality)
      * contrast.specularBoost,
  };
}
