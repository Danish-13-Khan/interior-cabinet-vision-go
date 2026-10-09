import type { LightEntity, ParameterValue } from "../../../domain/interiorProject";
import { fixtureNumber } from "../../../domain/livingRoom/lightFixtureProperties";
import {
  fixtureEmissiveIntensity,
  fixtureRenderIntensity,
  LIGHT_RENDER_SCALE,
} from "../../../domain/livingRoom/lightFixtureTypes";
import { LIGHT_PARAMETER_LIMITS } from "../../../domain/livingRoom/lightParameterLimits";
import { bodyFinish } from "../../../domain/livingRoom/lightShade";

/**
 * Every fixture body is authored so its emitter faces local −Z.
 * Only FixtureGroup applies the saved rotation, and it uses Euler order
 * "YXZ" — the same order the wall and ceiling resolvers were written for.
 * Do not tilt a body from `rotation.x` / `rotation.z` inside a fixture.
 */
export function roomLightRotation(
  rotation: { x: number; y: number; z: number },
): [number, number, number, "YXZ"] {
  const toRad = Math.PI / 180;
  return [rotation.x * toRad, rotation.y * toRad, rotation.z * toRad, "YXZ"];
}

/**
 * Cove only. The group's X = 90° turn aims local −Z up. This child turn
 * aims that same −Z axis along parent +Y, which the group lays onto the wall.
 * XYZ on the child; the group alone carries YXZ.
 */
export const COVE_WALL_LIGHT_ROTATION: [number, number, number] = [Math.PI / 2, 0, 0];

/** Wall-band intensity. The share lives in LIGHT_RENDER_SCALE, not a new constant. */
export function coveWallIntensity(areaIntensity: number) {
  return areaIntensity * LIGHT_RENDER_SCALE.coveWallShare;
}

/**
 * A rope or profile only emits away from its wall, so the wall it sits on stays dark.
 * A second rect area this far off the wall, turned back to face it, gives the halo a real
 * strip has. Metres.
 */
export const STRIP_HALO_STANDOFF_M = 0.06;

/** Local rotation that turns the −Z emitter back onto the wall behind the strip. */
export const STRIP_HALO_ROTATION: [number, number, number] = [0, Math.PI, 0];

export function stripHaloIntensity(areaIntensity: number) {
  return areaIntensity * LIGHT_RENDER_SCALE.stripHaloShare;
}

export function clampedHeadCount(light: { parameters: Record<string, ParameterValue> }) {
  const raw = Math.round(fixtureNumber(light, "headCount", 3));
  const { min, max } = LIGHT_PARAMETER_LIMITS.headCount;
  return Math.min(max, Math.max(min, Number.isFinite(raw) ? raw : min));
}

/** Full beam in degrees becomes the spot's half-angle in radians. */
export function beamHalfAngleRad(light: { parameters: Record<string, ParameterValue> }) {
  return fixtureNumber(light, "beamAngleDeg", 36) * Math.PI / 360;
}

export type FixtureSize = {
  length: number;
  across: number;
  depth: number;
  body: string;
  metal: number;
  glow: number;
  intensity: number;
  cast: boolean;
  range: number;
};

/** Metres and physical intensity for one fixture. Missing sizes fall back to the strip. */
export function readFixtureSize(light: LightEntity, intensityScale: number, castShadow: boolean): FixtureSize {
  const { body, metal: metalness } = bodyFinish(light);
  return {
    length: Math.max(0.02, fixtureNumber(light, "widthMm", 1000) / 1000),
    across: Math.max(0.004, fixtureNumber(light, "heightMm", 20) / 1000),
    depth: Math.max(0.004, fixtureNumber(light, "depthMm", 20) / 1000),
    body,
    metal: metalness,
    glow: fixtureEmissiveIntensity(light),
    intensity: fixtureRenderIntensity(light, light.kind, intensityScale),
    cast: castShadow && light.enabled,
    range: Math.max(0.05, fixtureNumber(light, "rangeMm", 5000) / 1000),
  };
}
