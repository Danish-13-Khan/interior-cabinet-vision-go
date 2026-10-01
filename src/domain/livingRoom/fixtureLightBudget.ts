import type { LightKind, ParameterValue } from "../interiorProject";
import { shouldProjectFillCastShadow } from "./directionalCasterBudget";
import { isLightFixtureKind } from "./lightFixtureRegistry";
import { LIGHT_PARAMETER_LIMITS } from "./lightParameterLimits";
import { resolveModelViewLightingQuality } from "./modelViewPreviewDefaults";

/**
 * three.js keys its shader program cache on light counts
 * (`WebGLPrograms.js` `numSpotLights`, `numRectAreaLights`, …).
 * A count change recompiles every material once. Disabled fixtures stay
 * mounted, so toggling `enabled` does not change the key.
 */
export const MODEL_VIEW_FIXTURE_SOURCE_BUDGET = 12;

export type ShaderLightCounts = {
  numRectAreaLights: number;
  numSpotLights: number;
  numPointLights: number;
};

type CountedLight = {
  enabled: boolean;
  kind: LightKind;
  parameters: Record<string, ParameterValue>;
};

/** Room fixtures stay in the scene when off (intensity 0). Other lights unmount. */
export function projectLightIsMounted(light: Pick<CountedLight, "enabled" | "parameters">): boolean {
  return light.enabled || isLightFixtureKind(light.parameters.fixtureKind);
}

function headSources(light: CountedLight) {
  const raw = Number(light.parameters.headCount ?? 3);
  const heads = Number.isFinite(raw) ? Math.round(raw) : LIGHT_PARAMETER_LIMITS.headCount.min;
  const { min, max } = LIGHT_PARAMETER_LIMITS.headCount;
  return Math.min(max, Math.max(min, heads));
}

const EMPTY: ShaderLightCounts = { numRectAreaLights: 0, numSpotLights: 0, numPointLights: 0 };

/**
 * Sources, not fixtures. A cove is two rect lights (up-light + wall share).
 * A track is one spot per head.
 */
export function fixtureShaderCounts(light: CountedLight): ShaderLightCounts {
  if (!projectLightIsMounted(light)) return EMPTY;
  const kind = light.parameters.fixtureKind;
  if (kind === "cove") return { numRectAreaLights: 2, numSpotLights: 0, numPointLights: 0 };
  if (kind === "track") return { numRectAreaLights: 0, numSpotLights: headSources(light), numPointLights: 0 };
  if (kind === "pendant") return { numRectAreaLights: 0, numSpotLights: 0, numPointLights: 1 };
  if (kind === "cob" || kind === "ceiling-downlight") return { numRectAreaLights: 0, numSpotLights: 1, numPointLights: 0 };
  if (isLightFixtureKind(kind)) return { numRectAreaLights: 1, numSpotLights: 0, numPointLights: 0 };
  if (light.kind === "area") return { numRectAreaLights: 1, numSpotLights: 0, numPointLights: 0 };
  if (light.kind === "spot") return { numRectAreaLights: 0, numSpotLights: 1, numPointLights: 0 };
  if (light.kind === "point") return { numRectAreaLights: 0, numSpotLights: 0, numPointLights: 1 };
  return EMPTY;
}

export function sumShaderCounts(lights: readonly CountedLight[]): ShaderLightCounts {
  return lights.reduce((total, light) => {
    const next = fixtureShaderCounts(light);
    return {
      numRectAreaLights: total.numRectAreaLights + next.numRectAreaLights,
      numSpotLights: total.numSpotLights + next.numSpotLights,
      numPointLights: total.numPointLights + next.numPointLights,
    };
  }, { ...EMPTY });
}

export function shaderSourceTotal(counts: ShaderLightCounts) {
  return counts.numRectAreaLights + counts.numSpotLights + counts.numPointLights;
}

/** Cache key three.js rebuilds a program for. Equal keys mean no recompile. */
export function shaderProgramCacheKey(counts: ShaderLightCounts) {
  return `rect:${counts.numRectAreaLights}|spot:${counts.numSpotLights}|point:${counts.numPointLights}`;
}

/** How many sources appeared or vanished — the hitch, not a frame-time sample. */
export function lightCountRecompileHitch(before: ShaderLightCounts, after: ShaderLightCounts) {
  return Math.abs(shaderSourceTotal(after) - shaderSourceTotal(before));
}

export function withinModelViewLightBudget(sourceCount: number) {
  return sourceCount <= MODEL_VIEW_FIXTURE_SOURCE_BUDGET;
}

/** Model View sets a directional budget, so fixture fills never cast shadow maps. */
export function modelViewFixturesCastShadows(quality: "draft" | "standard") {
  const budget = resolveModelViewLightingQuality(quality).maxDirectionalCasters;
  return shouldProjectFillCastShadow(budget);
}
