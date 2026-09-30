import type { LightKind } from "../interiorProject";

/**
 * Authoring brightness stays 0–100. Physical units live only in this table.
 *
 * Phase 0 review (2026-09-30, release demo, Model View draft, pixel readout on
 * the back wall): a downlight at 2000 cd clipped the whole floor to white;
 * 20 cd read as a subtle pool and 40–60 cd as a real downlight, so spot/point
 * sit near 10 / 8 cd per unit. A 1 m × 20 mm strip 130 mm from a wall lifts
 * the wall from 231 to 243 at 18 nits and to 252 at 60 nits, so 10 nits per
 * unit puts the default cove (brightness 3) at a soft 30 nits with headroom.
 * Rect area lights are nits (cd/m²) and behave correctly down to at least
 * 120 mm from the lit surface; no segmentation is needed.
 */
export interface LightProperties {
  enabled: boolean;
  /** 0–100 authoring brightness, not candela or nits. */
  intensity: number;
  color?: string;
  /** Kelvin. Stored on the entity as parameters.colorTemperatureK. */
  colorTemperature?: number;
}

export const LIGHT_RENDER_SCALE = {
  areaNitsPerUnit: 10,
  pointCandelaPerUnit: 8,
  spotCandelaPerUnit: 10,
  emissivePerUnit: 0.22,
  maxEmissive: 4,
  coveWallShare: 0.35,
  /** Former inline `0.58` on recipe ambient lights. */
  recipeAmbientScale: 0.58,
  /** Former inline `0.86` on recipe directional lights. */
  recipeDirectionalScale: 0.86,
} as const;

function candelaOrNitsPerUnit(kind: LightKind) {
  if (kind === "area") return LIGHT_RENDER_SCALE.areaNitsPerUnit;
  if (kind === "spot") return LIGHT_RENDER_SCALE.spotCandelaPerUnit;
  return LIGHT_RENDER_SCALE.pointCandelaPerUnit;
}

/** Physical intensity for a room fixture. Disabled lights contribute nothing. */
export function fixtureRenderIntensity(
  light: Pick<LightProperties, "enabled" | "intensity">,
  kind: LightKind,
  scale: number,
) {
  if (!light.enabled) return 0;
  return light.intensity * candelaOrNitsPerUnit(kind) * scale;
}

/** Emissive mesh glow. Independent of the project light scale. */
export function fixtureEmissiveIntensity(
  light: Pick<LightProperties, "enabled" | "intensity">,
) {
  if (!light.enabled) return 0;
  return Math.min(
    LIGHT_RENDER_SCALE.maxEmissive,
    light.intensity * LIGHT_RENDER_SCALE.emissivePerUnit,
  );
}

export type {
  LightFixtureCategory,
  LightFixtureDefaults,
  LightFixtureDefinition,
  LightFixtureKind,
  LightMountKind,
} from "./lightFixtureRegistry";
export {
  LIGHT_FIXTURE_CATEGORY_LABELS,
  LIGHT_FIXTURE_DEFINITIONS,
  getLightFixtureDefinition,
  isLightFixtureKind,
  lightFixtureDefinitionFor,
  listLightFixtureDefinitions,
} from "./lightFixtureRegistry";
export {
  applyLightProperties,
  defaultFixtureColor,
  fixtureNumber,
  readLightProperties,
} from "./lightFixtureProperties";
