/**
 * Authoring brightness stays 0–100. Physical units live only in this table.
 * §3.4's first guess (6 nits / 4 cd / 5 cd) was checked on the release demo:
 * a default cove (brightness 3) and downlight (brightness 5) changed no
 * pixels against the HDRI fill. The per-unit figures below are the Phase 0
 * browser retune. Recipe ambient / directional multipliers stay 0.58 / 0.86.
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
  areaNitsPerUnit: 200,
  pointCandelaPerUnit: 180,
  spotCandelaPerUnit: 400,
  emissivePerUnit: 0.22,
  maxEmissive: 4,
  coveWallShare: 0.35,
  /** Former inline `0.58` on recipe ambient lights. */
  recipeAmbientScale: 0.58,
  /** Former inline `0.86` on recipe directional lights. */
  recipeDirectionalScale: 0.86,
} as const;

function candelaOrNitsPerUnit(kind: string) {
  if (kind === "area") return LIGHT_RENDER_SCALE.areaNitsPerUnit;
  if (kind === "spot") return LIGHT_RENDER_SCALE.spotCandelaPerUnit;
  return LIGHT_RENDER_SCALE.pointCandelaPerUnit;
}

/** Physical intensity for a room fixture. Disabled lights contribute nothing. */
export function fixtureRenderIntensity(
  light: Pick<LightProperties, "enabled" | "intensity">,
  kind: string,
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
