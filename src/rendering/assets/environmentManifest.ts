import type { EnvironmentAssetDefinition } from "../../domain/livingRoom/renderAssetContracts";

/**
 * Local HDR presets bound to living-room lighting recipes.
 * Files are Poly Haven CC0 1k (1024×512) pure skies: kloppenheim_06 for
 * daylight, belfast_sunset for neutral studio, qwantani_dusk_2 for warm evening.
 * Even skies, so semi-gloss floors do not mirror a lamp grid. Only the active recipe is mounted.
 */
export const ENVIRONMENT_ASSET_MANIFEST = [
  {
    id: "env:daylight",
    name: "Soft Daylight HDRI",
    lightingRecipeId: "daylight",
    assetKey: "environments/daylight.hdr",
    available: true,
    intensity: 1.15,
    backgroundBlur: 0.35,
  },
  {
    id: "env:warm-evening",
    name: "Warm Evening HDRI",
    lightingRecipeId: "warm-evening",
    assetKey: "environments/warm-evening.hdr",
    available: true,
    intensity: 0.72,
    backgroundBlur: 0.45,
  },
  {
    id: "env:neutral-studio",
    name: "Neutral Studio HDRI",
    lightingRecipeId: "neutral-studio",
    assetKey: "environments/neutral-studio.hdr",
    available: true,
    intensity: 1,
    backgroundBlur: 0.25,
  },
] as const satisfies readonly EnvironmentAssetDefinition[];
