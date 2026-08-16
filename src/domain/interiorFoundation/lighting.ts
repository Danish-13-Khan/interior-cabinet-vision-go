import type { EulerDegrees, LightEntity, LightKind, ParameterValue, Point3Mm } from "../interiorProject";

export type LightingSeed = {
  key: string;
  name: string;
  kind: LightKind;
  position: Point3Mm;
  rotation?: EulerDegrees;
  color: string;
  intensity: number;
  parameters?: Record<string, ParameterValue>;
};

export type LightingRecipe<Id extends string> = {
  id: Id;
  name: string;
  lights: readonly LightingSeed[];
};

/** Builds named, switchable lighting rigs while preserving a common entity shape. */
export function createLightingRigs<Id extends string>(args: {
  roomId: string;
  activeRecipeId: Id;
  recipes: readonly LightingRecipe<Id>[];
  idFactory: (scope: "light", key: string) => string;
}): LightEntity[] {
  return args.recipes.flatMap((recipe) => recipe.lights.map((light) => ({
    id: args.idFactory("light", `${recipe.id}-${light.key}`),
    roomId: args.roomId,
    name: light.name,
    kind: light.kind,
    position: { ...light.position },
    rotation: { ...(light.rotation ?? { x: 0, y: 0, z: 0 }) },
    color: light.color,
    intensity: light.intensity,
    enabled: recipe.id === args.activeRecipeId,
    parameters: { ...light.parameters, recipeId: recipe.id },
  })));
}
