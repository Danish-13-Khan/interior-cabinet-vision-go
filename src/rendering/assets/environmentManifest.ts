import type { EnvironmentAssetDefinition } from "../../domain/livingRoom/renderAssetContracts";

/** HDRI presets aligned to living-room lighting recipes. Not yet on disk. */
export const ENVIRONMENT_ASSET_MANIFEST = [
  {
    id: "env:daylight",
    name: "Soft Daylight HDRI",
    lightingRecipeId: "daylight",
    assetKey: "environments/daylight.hdr",
    available: false,
  },
  {
    id: "env:warm-evening",
    name: "Warm Evening HDRI",
    lightingRecipeId: "warm-evening",
    assetKey: "environments/warm-evening.hdr",
    available: false,
  },
  {
    id: "env:neutral-studio",
    name: "Neutral Studio HDRI",
    lightingRecipeId: "neutral-studio",
    assetKey: "environments/neutral-studio.hdr",
    available: false,
  },
] as const satisfies readonly EnvironmentAssetDefinition[];
