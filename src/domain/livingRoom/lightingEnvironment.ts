import type { LivingRoomLightingRecipeId } from "./lighting";

/** Stable environment asset ids bound to living-room lighting recipes. */
export const LIGHTING_RECIPE_ENVIRONMENT_IDS = {
  daylight: "env:daylight",
  "warm-evening": "env:warm-evening",
  "neutral-studio": "env:neutral-studio",
} as const satisfies Record<LivingRoomLightingRecipeId, string>;

export function isLivingRoomLightingRecipeId(
  value: string,
): value is LivingRoomLightingRecipeId {
  return value in LIGHTING_RECIPE_ENVIRONMENT_IDS;
}

export function environmentAssetIdForRecipe(recipeId: string) {
  if (!isLivingRoomLightingRecipeId(recipeId)) return null;
  return LIGHTING_RECIPE_ENVIRONMENT_IDS[recipeId];
}

export type LightformerFallbackTone = {
  key: string;
  sky: string;
  fill: string;
  rim: string;
  skyIntensity: number;
  fillIntensity: number;
  rimIntensity: number;
};

/** Procedural Lightformer colors used when HDR files are unavailable. */
export const LIGHTFORMER_FALLBACK_BY_RECIPE: Record<
  LivingRoomLightingRecipeId,
  LightformerFallbackTone
> = {
  daylight: {
    key: "daylight",
    sky: "#eaf3ff",
    fill: "#d7e7ff",
    rim: "#fff1d8",
    skyIntensity: 1.2,
    fillIntensity: 0.85,
    rimIntensity: 0.45,
  },
  "warm-evening": {
    key: "warm-evening",
    sky: "#ffd7b0",
    fill: "#ffb57a",
    rim: "#ffe8cf",
    skyIntensity: 0.95,
    fillIntensity: 0.7,
    rimIntensity: 0.55,
  },
  "neutral-studio": {
    key: "neutral-studio",
    sky: "#fff8ef",
    fill: "#dfeaff",
    rim: "#ffe3c4",
    skyIntensity: 1.15,
    fillIntensity: 0.75,
    rimIntensity: 0.5,
  },
};

export function lightformerFallbackForRecipe(recipeId: string) {
  if (!isLivingRoomLightingRecipeId(recipeId)) {
    return LIGHTFORMER_FALLBACK_BY_RECIPE["neutral-studio"];
  }
  return LIGHTFORMER_FALLBACK_BY_RECIPE[recipeId];
}
