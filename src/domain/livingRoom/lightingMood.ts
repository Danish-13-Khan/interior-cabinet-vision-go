import type { InteriorProject } from "../interiorProject";

/**
 * Day shows the room under its recipe: daylight, sky and window keys.
 * Evening turns that room light down so the fixtures the designer placed
 * carry the scene. Saved with the project, so it reopens looking lit.
 */
export type LightingMood = "day" | "evening";

const EXTENSION_KEY = "lightingMood";

/** Share of the recipe's ambient, sun, sky and window light kept in evening. */
export const EVENING_ROOM_LIGHT_SCALE = 0.18;

/**
 * Evening HDRI and hemisphere fill. The sun and window keys stay at
 * {@link EVENING_ROOM_LIGHT_SCALE} so placed fixtures still lead. The sky keeps
 * more than the sun: at 0.18 the walnut fronts went black, at 1 the evening
 * card heroes read as daylight (the 1 BHK hit 197 against a 175 cap). 0.35
 * measured 167 on the 1 BHK card crop and left the 2 BHK fronts at 82/36/25.
 */
export const EVENING_ENVIRONMENT_SCALE = 0.35;

/** Day keeps the map as authored. Evening keeps the fill and drops the sun. */
export function environmentScaleForRoomLight(roomLightScale: number): number {
  return roomLightScale === 1 ? 1 : EVENING_ENVIRONMENT_SCALE;
}

export function readLightingMood(project: Pick<InteriorProject, "extensions">): LightingMood {
  return project.extensions?.[EXTENSION_KEY] === "evening" ? "evening" : "day";
}

/** Day is the default and is stored as an absent key, so old files stay byte-identical. */
export function writeLightingMood(project: InteriorProject, mood: LightingMood): InteriorProject {
  if (readLightingMood(project) === mood) return project;
  const extensions = { ...(project.extensions ?? {}) };
  if (mood === "evening") extensions[EXTENSION_KEY] = "evening";
  else delete extensions[EXTENSION_KEY];
  return { ...project, extensions };
}

/** Multiplier for everything that is not a placed fixture. */
export function roomLightScaleForMood(mood: LightingMood): number {
  return mood === "evening" ? EVENING_ROOM_LIGHT_SCALE : 1;
}

/**
 * Mood on screen: a view-only override (Showcase tour / Present) wins over the
 * saved mood. Reading never writes, so toggling the override cannot dirty the project.
 */
export function viewLightingMood(
  project: Pick<InteriorProject, "extensions">,
  override: LightingMood | null,
): LightingMood {
  return override ?? readLightingMood(project);
}

/**
 * An evening recipe carries the evening look (warm HDRI, low window keys). In
 * day mood the room is lit by the daylight recipe instead, so Day reads as day.
 */
export function lightingRecipeForMood(recipeId: string, mood: LightingMood): string {
  return mood === "day" && recipeId === "warm-evening" ? "daylight" : recipeId;
}
