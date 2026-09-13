import type { LightEntity } from "../interiorProject";

/** Kelvin range we accept from users; outside this a fixture is not a room light. */
export const MIN_LIGHT_KELVIN = 1800;
export const MAX_LIGHT_KELVIN = 8000;
export const DEFAULT_LIGHT_KELVIN = 3000;

export const KELVIN_PRESETS = [
  { kelvin: 2700, label: "Warm" },
  { kelvin: 3000, label: "Warm white" },
  { kelvin: 4000, label: "Neutral" },
  { kelvin: 5000, label: "Cool white" },
  { kelvin: 6500, label: "Daylight" },
] as const;

const clampByte = (value: number) => Math.min(255, Math.max(0, Math.round(value)));

function hex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((channel) => clampByte(channel).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Planckian locus approximation (Tanner Helland). Good enough for fixture tint;
 * it is not a photometric claim, and intensity stays a separate renderer control.
 */
export function kelvinToHex(kelvin: number): string {
  const k = Math.min(MAX_LIGHT_KELVIN, Math.max(MIN_LIGHT_KELVIN, kelvin)) / 100;
  const red = k <= 66 ? 255 : 329.698727446 * Math.pow(k - 60, -0.1332047592);
  const green = k <= 66
    ? 99.4708025861 * Math.log(k) - 161.1195681661
    : 288.1221695283 * Math.pow(k - 60, -0.0755148492);
  const blue = k >= 66 ? 255 : k <= 19 ? 0 : 138.5177312231 * Math.log(k - 10) - 305.0447927307;
  return hex(red, green, blue);
}

export function isLightKelvin(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
    && value >= MIN_LIGHT_KELVIN && value <= MAX_LIGHT_KELVIN;
}

/** Saved Kelvin when the fixture has one; null for fixtures coloured by hand. */
export function readLightKelvin(light: LightEntity): number | null {
  const raw = light.parameters.colorTemperatureK;
  return isLightKelvin(raw) ? raw : null;
}

export function nearestKelvinPreset(kelvin: number) {
  return KELVIN_PRESETS.reduce((best, preset) =>
    Math.abs(preset.kelvin - kelvin) < Math.abs(best.kelvin - kelvin) ? preset : best);
}
