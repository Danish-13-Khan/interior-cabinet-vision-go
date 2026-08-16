import type {
  InteriorProject,
  LightEntity,
} from "../interiorProject";
import { createLightingRigs, type LightingSeed } from "../interiorFoundation";
import type { LivingRoomIdFactory } from "./ids";

export type LivingRoomLightingRecipeId =
  | "daylight"
  | "warm-evening"
  | "neutral-studio";

type LightSeed = LightingSeed;

export type LivingRoomLightingRecipe = {
  id: LivingRoomLightingRecipeId;
  name: string;
  lights: readonly LightSeed[];
};

export const LIVING_ROOM_LIGHTING_RECIPES: readonly LivingRoomLightingRecipe[] = [
  {
    id: "daylight",
    name: "Soft Daylight",
    lights: [
      {
        key: "ambient",
        name: "Daylight Fill",
        kind: "ambient",
        position: { x: 0, y: 2400, z: 0 },
        color: "#eaf3ff",
        intensity: 0.54,
      },
      {
        key: "window",
        name: "Window Daylight",
        kind: "area",
        position: { x: -2850, y: 1850, z: -250 },
        rotation: { x: 0, y: 90, z: 0 },
        color: "#dcecff",
        intensity: 2.2,
        parameters: { widthMm: 1800, heightMm: 1200 },
      },
      {
        key: "sun-fill",
        name: "Soft Window Shadow",
        kind: "directional",
        position: { x: -3600, y: 4200, z: 2600 },
        rotation: { x: -42, y: 38, z: 0 },
        color: "#f4f8ff",
        intensity: 0.58,
        parameters: { castShadow: true },
      },
    ],
  },
  {
    id: "warm-evening",
    name: "Warm Evening",
    lights: [
      {
        key: "ambient",
        name: "Evening Fill",
        kind: "ambient",
        position: { x: 0, y: 2200, z: 0 },
        color: "#ffd9b0",
        intensity: 0.34,
      },
      {
        key: "floor-lamp",
        name: "Floor Lamp Glow",
        kind: "point",
        position: { x: 2500, y: 1420, z: 700 },
        color: "#ffc17a",
        intensity: 7.5,
        parameters: { rangeMm: 3200 },
      },
      {
        key: "ceiling",
        name: "Warm Ceiling Wash",
        kind: "area",
        position: { x: 0, y: 2650, z: 0 },
        rotation: { x: -90, y: 0, z: 0 },
        color: "#ffe0bd",
        intensity: 2.1,
        parameters: { widthMm: 3600, heightMm: 2400 },
      },
    ],
  },
  {
    id: "neutral-studio",
    name: "Neutral Studio",
    lights: [
      {
        key: "ambient",
        name: "Studio Fill",
        kind: "ambient",
        position: { x: 0, y: 2300, z: 0 },
        color: "#ffffff",
        intensity: 0.58,
      },
      {
        key: "key",
        name: "Studio Key",
        kind: "directional",
        position: { x: 2600, y: 2500, z: 2200 },
        rotation: { x: -38, y: -42, z: 0 },
        color: "#fff5e8",
        intensity: 2.8,
        parameters: { castShadow: true },
      },
      {
        key: "window-fill",
        name: "Studio Window Fill",
        kind: "area",
        position: { x: -2800, y: 1750, z: 0 },
        rotation: { x: 0, y: 90, z: 0 },
        color: "#dbe8ff",
        intensity: 2.2,
        parameters: { widthMm: 1600, heightMm: 1100 },
      },
    ],
  },
];

export function createLivingRoomLights(
  roomId: string,
  activeRecipeId: LivingRoomLightingRecipeId,
  idFactory: LivingRoomIdFactory,
): LightEntity[] {
  return createLightingRigs({
    roomId,
    activeRecipeId,
    recipes: LIVING_ROOM_LIGHTING_RECIPES,
    idFactory,
  });
}

/** Activate a complete standard rig while retaining user-authored custom lights. */
export function applyLivingRoomLightingRecipe(
  project: InteriorProject,
  recipeId: LivingRoomLightingRecipeId,
): InteriorProject {
  const generated = createLivingRoomLights(
    project.activeRoomId,
    recipeId,
    (scope, key) => `lr-render-${scope}-${key}`,
  );
  const recipeKey = (light: LightEntity) =>
    `${String(light.parameters.recipeId ?? "")}:${light.name}`;
  const generatedKeys = new Set(generated.map(recipeKey));
  const existingByKey = new Map(project.lights.map((light) => [recipeKey(light), light]));
  const rig = generated.map((light) => {
    const existing = existingByKey.get(recipeKey(light));
    return existing ? { ...light, id: existing.id } : light;
  });
  return {
    ...project,
    lights: [
      ...project.lights.filter((light) => !generatedKeys.has(recipeKey(light))),
      ...rig,
    ],
    renderSettings: {
      ...project.renderSettings,
      lightingRecipeId: recipeId,
    },
  };
}

export {
  environmentAssetIdForRecipe,
  LIGHTING_RECIPE_ENVIRONMENT_IDS,
} from "./lightingEnvironment";
