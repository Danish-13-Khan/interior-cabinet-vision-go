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
