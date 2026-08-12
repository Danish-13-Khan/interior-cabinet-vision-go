import type { EnvironmentAssetDefinition } from "../../domain/livingRoom/renderAssetContracts";

/** Local HDR presets bound to living-room lighting recipes. */
export const ENVIRONMENT_ASSET_MANIFEST = [
  {
    id: "env:daylight",
    name: "Soft Daylight HDRI",
    lightingRecipeId: "daylight",
    assetKey: "environments/daylight.hdr",
    available: true,
    intensity: 0.95,
    backgroundBlur: 0.35,
  },
  {
    id: "env:warm-evening",
    name: "Warm Evening HDRI",
    lightingRecipeId: "warm-evening",
    assetKey: "environments/warm-evening.hdr",
    available: true,
    intensity: 0.82,
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
