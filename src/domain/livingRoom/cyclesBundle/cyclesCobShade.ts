import type { LightEntity } from "../../interiorProject";
import { fixtureNumber } from "../lightFixtureProperties";
import { cobShadeParts, gimbalEulerDeg, penumbraForDiffusion, readCobShade } from "../lightShade";
import { at, cylinder, kelvinOf } from "./cyclesPartHelpers";
import type { CyclesFixtureLight, CyclesFixturePart, CyclesTransform } from "./types";

type Size = { length: number; across: number; depth: number; intensity: number; range: number };

/**
 * COB / downlight body and spot for the Cycles bundle, from the same part list
 * `CobFixture.tsx` draws (roadmap §4.3). A gimbal's tilted parts and spot share
 * one tilted frame; a surface cylinder hangs below the ceiling plane.
 */
export function cobShadeFixtureParts(
  light: LightEntity,
  size: Size,
  glowColor: string,
  glow: { color: string; strength: number },
  emits: boolean,
  cast: boolean,
): { parts: CyclesFixturePart[]; lights: CyclesFixtureLight[] } {
  const spec = readCobShade(light);
  const radius = Math.max(size.length, size.across) / 2;
  const tilted: CyclesTransform | undefined = spec.shade === "gimbal"
    ? at(0, 0, 0, gimbalEulerDeg(spec.aimAngleDeg, spec.aimRotationDeg)) : undefined;
  const parts: CyclesFixturePart[] = cobShadeParts(spec, radius, size.depth, glowColor).map((part) => ({
    ...cylinder("cylinder", { radiusTop: part.radiusTop, radiusBottom: part.radiusBottom, height: part.height, segments: 28 },
      at(0, 0, part.z, [90, 0, 0]), part.color, part.metalness, part.roughness, part.glow ? glow : null),
    ...(part.tilted && tilted ? { within: tilted } : {}),
  }));
  const lights: CyclesFixtureLight[] = emits ? [{
    kind: "spot",
    id: `${light.id}:spot`,
    role: "head",
    local: at(0, 0, spec.shade === "surface" ? -(size.depth * 2 + 0.012) : -0.012),
    ...(tilted ? { within: tilted } : {}),
    color: light.color,
    kelvin: kelvinOf(light),
    candela: size.intensity,
    beamAngleDeg: fixtureNumber(light, "beamAngleDeg", 36),
    penumbra: penumbraForDiffusion(spec.lensDiffusion),
    rangeM: size.range,
    castShadow: cast,
  }] : [];
  return { parts, lights };
}
