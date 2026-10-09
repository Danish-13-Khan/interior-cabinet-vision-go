import type { ParameterValue } from "../interiorProject";
import { MAX_LIGHT_KELVIN, MIN_LIGHT_KELVIN } from "./lightColorTemperature";

type Limit = { min: number; max: number; minExclusive?: boolean; integer?: boolean };

/** Numeric keys `updateRoomLightFixture` accepts. Head cap is 6 (one spot each). */
export const LIGHT_PARAMETER_LIMITS = {
  widthMm: { min: 0, max: 100_000, minExclusive: true },
  heightMm: { min: 0, max: 100_000, minExclusive: true },
  depthMm: { min: 0, max: 100_000, minExclusive: true },
  rangeMm: { min: 0, max: 100_000, minExclusive: true },
  beamAngleDeg: { min: 0, max: 180, minExclusive: true },
  headCount: { min: 1, max: 6, integer: true },
  aimAngleDeg: { min: -90, max: 90 },
  centerHeightMm: { min: 0, max: 20_000 },
  alongMm: { min: -100_000, max: 100_000 },
  ceilingDropMm: { min: 0, max: 20_000 },
  offsetXmm: { min: -100_000, max: 100_000 },
  offsetYmm: { min: -100_000, max: 100_000 },
  offsetZmm: { min: -100_000, max: 100_000 },
  colorTemperatureK: { min: MIN_LIGHT_KELVIN, max: MAX_LIGHT_KELVIN },
  lensDiffusion: { min: 0, max: 1 },
  aimRotationDeg: { min: 0, max: 360 },
} as const satisfies Record<string, Limit>;

const PROFILE_FINISH = new Set(["aluminium", "black", "white"]);
const ORIENTATION = new Set(["horizontal", "vertical"]);
const COB_SHADE = new Set(["open", "baffle", "pinhole", "gimbal", "surface"]);
const TRIM_FINISH = new Set(["white", "black", "brass", "aluminium"]);

function within(value: number, band: Limit) {
  const aboveMin = band.minExclusive ? value > band.min : value >= band.min;
  if (!aboveMin || value > band.max) return false;
  return !band.integer || Number.isInteger(value);
}

/** False when a present key is the wrong type or outside its band. Absent keys pass. */
export function validParameters(parameters: Record<string, ParameterValue>): boolean {
  for (const key of Object.keys(LIGHT_PARAMETER_LIMITS) as Array<keyof typeof LIGHT_PARAMETER_LIMITS>) {
    if (!Object.prototype.hasOwnProperty.call(parameters, key)) continue;
    const value = parameters[key];
    if (typeof value !== "number" || !Number.isFinite(value)) return false;
    if (!within(value, LIGHT_PARAMETER_LIMITS[key])) return false;
  }
  const finish = parameters.profileFinish;
  if (finish !== undefined && (typeof finish !== "string" || !PROFILE_FINISH.has(finish))) return false;
  const orientation = parameters.orientation;
  if (orientation !== undefined && (typeof orientation !== "string" || !ORIENTATION.has(orientation))) return false;
  const shade = parameters.shade;
  if (shade !== undefined && (typeof shade !== "string" || !COB_SHADE.has(shade))) return false;
  const trim = parameters.trimFinish;
  if (trim !== undefined && (typeof trim !== "string" || !TRIM_FINISH.has(trim))) return false;
  const wallSide = parameters.wallSide;
  if (wallSide !== undefined && wallSide !== "interior" && wallSide !== "exterior") return false;
  if (parameters.hostSurface !== undefined && parameters.hostSurface !== "ceiling") return false;
  if (parameters.fitHostWidth !== undefined && typeof parameters.fitHostWidth !== "boolean") return false;
  if (parameters.attachmentMissing !== undefined && typeof parameters.attachmentMissing !== "boolean") return false;
  if (parameters.hostObjectId !== undefined && typeof parameters.hostObjectId !== "string") return false;
  if (parameters.hostWallId !== undefined && typeof parameters.hostWallId !== "string") return false;
  return true;
}
