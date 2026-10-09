import type { LightEntity } from "../../interiorProject";
import type { CyclesFixtureLight, CyclesFixturePart, CyclesTransform } from "./types";

/** Part and light constructors shared by the fixture builders (metres, degrees, XYZ Euler). */
export function at(x: number, y: number, z: number, rotation: [number, number, number] = [0, 0, 0]): CyclesTransform {
  return {
    position: { x, y, z },
    rotation: { x: rotation[0], y: rotation[1], z: rotation[2], order: "XYZ" },
  };
}

export function kelvinOf(light: LightEntity): number | null {
  const value = light.parameters.colorTemperatureK;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function box(
  size: [number, number, number],
  local: CyclesTransform,
  color: string,
  metalness: number,
  roughness: number,
  emissive: { color: string; strength: number } | null = null,
): CyclesFixturePart {
  return {
    shape: "box",
    box: { width: size[0], height: size[1], depth: size[2] },
    local,
    color,
    metalness,
    roughness,
    emissiveColor: emissive?.color ?? null,
    emissiveStrength: emissive?.strength ?? 0,
  };
}

export function cylinder(
  shape: "cylinder" | "cone",
  cyl: { radiusTop: number; radiusBottom: number; height: number; segments: number },
  local: CyclesTransform,
  color: string,
  metalness: number,
  roughness: number,
  emissive: { color: string; strength: number } | null = null,
): CyclesFixturePart {
  return {
    shape,
    cyl,
    local,
    color,
    metalness,
    roughness,
    emissiveColor: emissive?.color ?? null,
    emissiveStrength: emissive?.strength ?? 0,
  };
}

export function area(
  id: string,
  role: "emitter" | "wall-band" | "halo",
  local: CyclesTransform,
  sizeM: { width: number; height: number },
  light: LightEntity,
  nits: number,
  castShadow: boolean,
): CyclesFixtureLight {
  return { kind: "area", id, role, local, sizeM, color: light.color, kelvin: kelvinOf(light), nits, castShadow };
}
