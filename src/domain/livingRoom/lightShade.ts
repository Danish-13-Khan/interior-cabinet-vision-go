import type { LightEntity } from "../interiorProject";
import { fixtureNumber } from "./lightFixtureProperties";

/** Roadmap §4.3: shade variants of the COB / downlight kinds, stored in `parameters`. */
export const COB_SHADES = ["open", "baffle", "pinhole", "gimbal", "surface"] as const;
export type CobShade = typeof COB_SHADES[number];
export const TRIM_FINISHES = ["white", "black", "brass", "aluminium"] as const;
export type TrimFinish = typeof TRIM_FINISHES[number];

export const COB_SHADE_LABELS: Record<CobShade, string> = {
  open: "Open", baffle: "Baffle", pinhole: "Pinhole", gimbal: "Gimbal", surface: "Surface cylinder",
};
export const TRIM_FINISH_LABELS: Record<TrimFinish, string> = {
  white: "White", black: "Black", brass: "Brass", aluminium: "Aluminium",
};

export type CobShadeSpec = {
  shade: CobShade;
  trimFinish: TrimFinish;
  /** 0 = hard edge, 1 = soft; maps to the spot's penumbra. */
  lensDiffusion: number;
  /** Gimbal only: tilt from straight down and the direction it leans toward. */
  aimAngleDeg: number;
  aimRotationDeg: number;
};

export const COB_SHADE_DEFAULTS: CobShadeSpec = { shade: "open", trimFinish: "white", lensDiffusion: 0.5, aimAngleDeg: 0, aimRotationDeg: 0 };

export function isCobShadeKind(kind: unknown): kind is "cob" | "ceiling-downlight" {
  return kind === "cob" || kind === "ceiling-downlight";
}

export function isCobShade(value: unknown): value is CobShade {
  return typeof value === "string" && (COB_SHADES as readonly string[]).includes(value);
}

export function isTrimFinish(value: unknown): value is TrimFinish {
  return typeof value === "string" && (TRIM_FINISHES as readonly string[]).includes(value);
}

/** Shade spec with defaults for anything unset; the gimbal tilt is clamped to 45°. */
export function readCobShade(light: Pick<LightEntity, "parameters">): CobShadeSpec {
  const shade = isCobShade(light.parameters.shade) ? light.parameters.shade : COB_SHADE_DEFAULTS.shade;
  const trimFinish = isTrimFinish(light.parameters.trimFinish) ? light.parameters.trimFinish : COB_SHADE_DEFAULTS.trimFinish;
  const diffusion = fixtureNumber(light, "lensDiffusion", COB_SHADE_DEFAULTS.lensDiffusion);
  const aim = shade === "gimbal" ? fixtureNumber(light, "aimAngleDeg", 0) : 0;
  return {
    shade,
    trimFinish,
    lensDiffusion: Math.min(1, Math.max(0, diffusion)),
    aimAngleDeg: Math.min(45, Math.max(0, aim)),
    aimRotationDeg: ((fixtureNumber(light, "aimRotationDeg", 0) % 360) + 360) % 360,
  };
}

/** Spot penumbra from lens diffusion: 0 → 0.35 (crisp), 1 → 0.9 (soft). */
export function penumbraForDiffusion(lensDiffusion: number) {
  return 0.35 + Math.min(1, Math.max(0, lensDiffusion)) * 0.55;
}

/** Body colour and metalness for a trim finish (viewport and Cycles share these). */
export function trimFinishColor(finish: TrimFinish): { body: string; metal: number } {
  if (finish === "black") return { body: "#1c1c1c", metal: 0.28 };
  if (finish === "brass") return { body: "#b08d57", metal: 0.85 };
  if (finish === "aluminium") return { body: "#c5c8cc", metal: 0.72 };
  return { body: "#f3f1ec", metal: 0.05 };
}

/** One cylinder of a shade body: axis along local Z, centred at `z` (+Z is into the ceiling). */
export type ShadePart = {
  id: string;
  radiusTop: number;
  radiusBottom: number;
  height: number;
  z: number;
  color: string;
  metalness: number;
  roughness: number;
  /** Emitting disc: takes the light colour and the emissive strength. */
  glow: boolean;
  /** Follows the gimbal tilt. */
  tilted: boolean;
};

const BAFFLE_BLACK = "#1c1c1c";

/**
 * The parts every shade is built from, in metres. The viewport maps them to
 * meshes and the Cycles bundle to cylinders, so a still matches the view.
 */
export function cobShadeParts(spec: CobShadeSpec, radius: number, depth: number, glowColor: string): ShadePart[] {
  const trim = trimFinishColor(spec.trimFinish);
  const can = (id: string, top: number, bottom: number, height: number, z: number): ShadePart =>
    ({ id, radiusTop: top, radiusBottom: bottom, height, z, color: trim.body, metalness: trim.metal, roughness: 0.34, glow: false, tilted: false });
  const disc = (id: string, r: number, z: number, tilted = false): ShadePart =>
    ({ id, radiusTop: r, radiusBottom: r, height: 0.004, z, color: glowColor, metalness: 0, roughness: 0.28, glow: true, tilted });
  switch (spec.shade) {
    case "baffle":
      return [
        can("can", radius, radius * 0.82, depth, depth / 2),
        { ...can("baffle", radius * 0.72, radius * 0.5, depth * 0.6, depth * 0.3), color: BAFFLE_BLACK, metalness: 0.1, roughness: 0.9 },
        disc("glow", radius * 0.5, -0.001),
      ];
    case "pinhole":
      return [
        can("can", radius, radius * 0.82, depth, depth / 2),
        can("plate", radius, radius, 0.006, -0.003),
        disc("glow", radius * 0.3, -0.007),
      ];
    case "gimbal":
      return [
        can("can", radius, radius * 0.82, depth, depth / 2),
        { ...can("cup", radius * 0.7, radius * 0.62, depth * 0.5, depth * 0.1), tilted: true },
        disc("glow", radius * 0.62, -0.001, true),
      ];
    case "surface":
      return [
        can("body", radius, radius, depth * 2, -depth),
        disc("glow", radius * 0.72, -(depth * 2 + 0.001)),
      ];
    default:
      return [can("can", radius, radius * 0.82, depth, depth / 2), disc("glow", radius * 0.72, -0.001)];
  }
}

/**
 * Gimbal tilt as one XYZ Euler (degrees) for the Cycles bundle. The viewport
 * nests a spin about Z (aimRotationDeg) outside a tilt about X (aimAngleDeg);
 * R = Rz(φ)·Rx(θ) read back in three.js XYZ order.
 */
export function gimbalEulerDeg(aimAngleDeg: number, aimRotationDeg: number): [number, number, number] {
  const θ = (aimAngleDeg * Math.PI) / 180; const φ = (aimRotationDeg * Math.PI) / 180;
  const c = Math.cos(φ); const s = Math.sin(φ); const ct = Math.cos(θ); const st = Math.sin(θ);
  const m13 = s * st; const m23 = -c * st; const m33 = ct; const m12 = -s * ct; const m11 = c;
  const y = Math.asin(Math.min(1, Math.max(-1, m13)));
  const x = Math.atan2(-m23, m33);
  const z = Math.atan2(-m12, m11);
  const deg = (r: number) => (r * 180) / Math.PI;
  return [deg(x), deg(y), deg(z)];
}

/** Where the beam cone preview ends: the spot's range, capped so it reads inside a room. */
export function beamConeDimensions(beamHalfAngleRad: number, rangeM: number): { lengthM: number; radiusM: number } {
  const lengthM = Math.max(0.3, Math.min(rangeM, 2.2));
  return { lengthM, radiusM: lengthM * Math.tan(Math.min(Math.PI / 2 - 0.01, Math.max(0.01, beamHalfAngleRad))) };
}
