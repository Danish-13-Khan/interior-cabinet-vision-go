import type { LightEntity, ParameterValue } from "../interiorProject";
import { DEFAULT_LIGHT_KELVIN, kelvinToHex } from "./lightColorTemperature";
import type { LightProperties } from "./lightFixtureTypes";

/** Numeric fixture parameter, or `fallback` when the saved value is missing. */
export function fixtureNumber(
  light: { parameters: Record<string, ParameterValue> },
  key: string,
  fallback: number,
): number {
  const value = light.parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function defaultFixtureColor(): string {
  return kelvinToHex(DEFAULT_LIGHT_KELVIN);
}

/** Authoring view of a light. Kelvin stays in `parameters.colorTemperatureK`. */
export function readLightProperties(light: LightEntity): LightProperties {
  const kelvin = light.parameters.colorTemperatureK;
  return {
    enabled: light.enabled,
    intensity: light.intensity,
    color: light.color,
    ...(typeof kelvin === "number" && Number.isFinite(kelvin) ? { colorTemperature: kelvin } : {}),
  };
}

/**
 * Apply authoring properties. A Kelvin edit owns the colour; a hand-picked
 * colour drops the saved temperature. Kelvin wins when both are present.
 */
export function applyLightProperties(light: LightEntity, patch: Partial<LightProperties>): LightEntity {
  let next: LightEntity = { ...light, parameters: { ...light.parameters } };
  if (patch.enabled !== undefined) next = { ...next, enabled: patch.enabled };
  if (patch.intensity !== undefined) {
    const intensity = Number.isFinite(patch.intensity)
      ? Math.min(100, Math.max(0, patch.intensity))
      : patch.intensity;
    next = { ...next, intensity };
  }
  if (patch.colorTemperature !== undefined) {
    return {
      ...next,
      color: kelvinToHex(patch.colorTemperature),
      parameters: { ...next.parameters, colorTemperatureK: patch.colorTemperature },
    };
  }
  if (patch.color === undefined) return next;
  const parameters = { ...next.parameters };
  delete parameters.colorTemperatureK;
  return { ...next, color: patch.color, parameters };
}
