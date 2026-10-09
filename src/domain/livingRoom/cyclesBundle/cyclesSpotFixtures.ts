import type { LightEntity } from "../../interiorProject";
import { fixtureNumber } from "../lightFixtureProperties";
import { LIGHT_PARAMETER_LIMITS } from "../lightParameterLimits";
import { at, box, cylinder, kelvinOf, type FixtureSize } from "./cyclesPartHelpers";
import type { CyclesFixtureLight, CyclesFixturePart, CyclesTransform } from "./types";

type Built = { parts: CyclesFixturePart[]; lights: CyclesFixtureLight[] };

function beamAngleDeg(light: LightEntity) {
  return fixtureNumber(light, "beamAngleDeg", 36);
}

function headCount(light: LightEntity) {
  const raw = Math.round(fixtureNumber(light, "headCount", 3));
  const { min, max } = LIGHT_PARAMETER_LIMITS.headCount;
  return Math.min(max, Math.max(min, Number.isFinite(raw) ? raw : min));
}

function headOffsets(count: number, length: number, across: number) {
  if (count <= 1) return [0];
  const inset = Math.min(across, length / 2);
  const usable = Math.max(0, length - inset * 2);
  const step = usable / (count - 1);
  const origin = -usable / 2;
  return Array.from({ length: count }, (_, index) => origin + step * index);
}

/** Track heads and the pendant, mirroring the viewport fixtures. Null for other kinds. */
export function spotFixtureParts(
  light: LightEntity,
  kind: string,
  size: FixtureSize,
  _glowColor: string,
  glow: { color: string; strength: number },
  emits: boolean,
  cast: boolean,
): Built | null {
  const parts: CyclesFixturePart[] = [];
  const lights: CyclesFixtureLight[] = [];
  if (kind === "track") {
    const heads = headCount(light);
    const aim = fixtureNumber(light, "aimAngleDeg", 20);
    const offsets = headOffsets(heads, size.length, size.across);
    parts.push(box([size.length, size.across * 0.45, size.depth * 0.4], at(0, 0, 0), size.body, size.metal, 0.36));
    offsets.forEach((x, index) => {
      // Heads alternate the tilt sign so the pools straddle the rail.
      const tilt = index % 2 === 0 ? aim : -aim;
      const head: CyclesTransform = at(x, 0, -(size.depth * 0.28), [tilt, 0, 0]);
      parts.push({
        ...cylinder(
          "cylinder",
          { radiusTop: size.across * 0.28, radiusBottom: size.across * 0.36, height: size.depth * 0.7, segments: 16 },
          at(0, 0, -size.depth * 0.35, [90, 0, 0]),
          size.body,
          size.metal,
          0.4,
          glow,
        ),
        within: head,
      });
      if (emits) {
        lights.push({
          kind: "spot",
          id: `${light.id}:head-${index + 1}`,
          role: "head",
          local: at(0, 0, -size.depth * 0.55),
          within: head,
          color: light.color,
          kelvin: kelvinOf(light),
          candela: size.intensity,
          beamAngleDeg: beamAngleDeg(light),
          penumbra: 0.55,
          rangeM: size.range,
          castShadow: cast,
        });
      }
    });
    return { parts, lights };
  }

  if (kind === "pendant") {
    const radius = Math.max(size.length, size.across) / 2;
    const stem = Math.min(0.008, radius * 0.12);
    parts.push(cylinder("cylinder", { radiusTop: stem, radiusBottom: stem, height: size.depth, segments: 8 }, at(0, 0, size.depth / 2, [90, 0, 0]), size.body, 0.4, 0.35));
    parts.push(cylinder("cone", { radiusTop: 0, radiusBottom: radius, height: size.depth, segments: 24 }, at(0, 0, 0, [90, 0, 0]), size.body, 0, 0.42, glow));
    if (emits) {
      lights.push({
        kind: "point",
        id: `${light.id}:point`,
        role: "pendant",
        local: at(0, 0, -size.depth * 0.35),
        color: light.color,
        kelvin: kelvinOf(light),
        candela: size.intensity,
        radiusM: Math.max(0.01, radius * 0.3),
        rangeM: size.range,
        castShadow: cast,
      });
    }
    return { parts, lights };
  }

  return null;
}
