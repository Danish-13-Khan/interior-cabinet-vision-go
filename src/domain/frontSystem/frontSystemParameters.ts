import type { CabinetConfig } from "../cabinetDimensions";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import {
  GOLA_PROFILE_KINDS,
  normalizeFrontSystem,
  type FrontSystem,
  type GolaProfileKind,
  type GolaProfileSize,
  type GolaProfiles,
} from "./golaProfiles";
import { doorFrontStyleFromParameters } from "./doorStyles";

type Parameters = Record<string, string | number | boolean>;

export const FRONT_SYSTEM_PARAMETER = "frontSystem";

/** Object parameter key for one profile dimension, e.g. `golaLHeightMm`, `golaWallDepthMm`. */
export function golaParameterKey(kind: GolaProfileKind, dimension: keyof GolaProfileSize): string {
  return `gola${kind === "wall" ? "Wall" : kind}${dimension === "heightMm" ? "Height" : "Depth"}Mm`;
}

/** Interiors objects keep the front system in parameters; null when the object never set one. */
export function frontSystemFromParameters(parameters: Parameters): FrontSystem | null {
  const kind = parameters[FRONT_SYSTEM_PARAMETER];
  if (kind !== "gola" && kind !== "handled") return null;
  if (kind === "handled") return { kind: "handled" };
  const profiles = Object.fromEntries(GOLA_PROFILE_KINDS.map((profile) => [profile, {
    heightMm: parameters[golaParameterKey(profile, "heightMm")],
    depthMm: parameters[golaParameterKey(profile, "depthMm")],
  }]));
  return normalizeFrontSystem({ kind: "gola", profiles });
}

/** Every gola parameter for one profile set; used to copy a cabinet's sizes along its run. */
export function golaParametersPatch(profiles: GolaProfiles): Parameters {
  const patch: Parameters = { [FRONT_SYSTEM_PARAMETER]: "gola" };
  for (const kind of GOLA_PROFILE_KINDS) {
    patch[golaParameterKey(kind, "heightMm")] = profiles[kind].heightMm;
    patch[golaParameterKey(kind, "depthMm")] = profiles[kind].depthMm;
  }
  return patch;
}

export function applyFrontSystemParameters(config: CabinetConfig, parameters: Parameters): CabinetConfig {
  const frontSystem = frontSystemFromParameters(parameters);
  const frontStyle = doorFrontStyleFromParameters(parameters);
  if (!frontSystem && !frontStyle) return config;
  const spec = normalizeConstructionSpec(config.type, config.construction);
  const next = {
    ...spec,
    ...(frontSystem ? { frontSystem } : {}),
    ...(frontStyle ? { frontStyle: frontStyle === "slab" ? undefined : frontStyle } : {}),
  };
  return { ...config, construction: normalizeConstructionSpec(config.type, next) };
}
