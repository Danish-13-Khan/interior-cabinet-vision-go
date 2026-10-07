import type { LightEntity, Point3Mm } from "../../interiorProject";
import { fixtureNumber } from "../lightFixtureProperties";
import { isLightFixtureKind } from "../lightFixtureRegistry";
import {
  fixtureEmissiveIntensity,
  fixtureRenderIntensity,
  LIGHT_RENDER_SCALE,
} from "../lightFixtureTypes";
import { LIGHT_PARAMETER_LIMITS } from "../lightParameterLimits";
import type { CompiledLivingRoomScene } from "../sceneTypes";
import { resolveWindowKeyLights } from "../windowKeyLight";
import type {
  CyclesEuler,
  CyclesFixture,
  CyclesFixtureLight,
  CyclesFixturePart,
  CyclesRecipeLight,
  CyclesTransform,
  CyclesVec3,
  CyclesWindowKey,
} from "./types";

/**
 * Mirrors `rendering/lighting/fixtures/*`: every body and light a fixture creates in
 * the viewport, in the fixture's own frame (emitter faces local −Z). The group
 * carries the saved rotation with the viewport's YXZ order. Metres and degrees.
 */

const STRIP_HALO_STANDOFF_M = 0.06;

function metres(point: Point3Mm): CyclesVec3 {
  return { x: point.x / 1000, y: point.y / 1000, z: point.z / 1000 };
}

function at(x: number, y: number, z: number, rotation: [number, number, number] = [0, 0, 0]): CyclesTransform {
  return {
    position: { x, y, z },
    rotation: { x: rotation[0], y: rotation[1], z: rotation[2], order: "XYZ" },
  };
}

function kelvinOf(light: LightEntity): number | null {
  const value = light.parameters.colorTemperatureK;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

type FixtureSize = {
  length: number;
  across: number;
  depth: number;
  body: string;
  metal: number;
  glow: number;
  intensity: number;
  range: number;
};

/** Same table as `readFixtureSize`, at the authored (scale 1) physical intensity. */
function fixtureSize(light: LightEntity): FixtureSize {
  const finish = light.parameters.profileFinish;
  const metal = finish === "aluminium" ? 0.72 : finish === "black" ? 0.28 : 0.05;
  let body = "#d8d3cb";
  if (finish === "aluminium") body = "#c5c8cc";
  else if (finish === "black") body = "#1c1c1c";
  else if (finish === "white") body = "#f3f1ec";
  if (!light.enabled) body = "#dedbd5";
  return {
    length: Math.max(0.02, fixtureNumber(light, "widthMm", 1000) / 1000),
    across: Math.max(0.004, fixtureNumber(light, "heightMm", 20) / 1000),
    depth: Math.max(0.004, fixtureNumber(light, "depthMm", 20) / 1000),
    body,
    metal,
    glow: fixtureEmissiveIntensity(light),
    intensity: fixtureRenderIntensity(light, light.kind, 1),
    range: Math.max(0.05, fixtureNumber(light, "rangeMm", 5000) / 1000),
  };
}

function box(
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

function cylinder(
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

function area(
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

function fixtureParts(light: LightEntity, kind: string, size: FixtureSize): { parts: CyclesFixturePart[]; lights: CyclesFixtureLight[] } {
  const glowColor = light.enabled ? light.color : size.body;
  const glow = { color: glowColor, strength: size.glow };
  const emits = light.enabled && light.parameters.emissiveOnly !== true;
  const cast = light.enabled;
  const parts: CyclesFixturePart[] = [];
  const lights: CyclesFixtureLight[] = [];

  if (kind === "cove") {
    const board = size.across;
    const emitZ = -(board / 2 + 0.006);
    parts.push(box([size.length, size.depth, board], at(0, 0, 0), size.body, 0.25, 0.48));
    parts.push(box([size.length * 0.92, size.depth * 0.55, 0.004], at(0, 0, emitZ), glowColor, 0, 0.35, glow));
    if (emits) {
      lights.push(area(`${light.id}:up`, "emitter", at(0, 0, emitZ - 0.004), { width: size.length, height: size.depth }, light, size.intensity, cast));
      lights.push(area(
        `${light.id}:wall`,
        "wall-band",
        at(0, -size.depth * 0.2, emitZ, [90, 0, 0]),
        { width: size.length, height: size.depth },
        light,
        size.intensity * LIGHT_RENDER_SCALE.coveWallShare,
        cast,
      ));
    }
    return { parts, lights };
  }

  if (kind === "rope" || kind === "profile" || kind === "under-cabinet") {
    const vertical = kind === "profile" && light.parameters.orientation === "vertical";
    const rope = kind === "rope";
    const span: [number, number, number] = vertical
      ? [size.across, size.length, size.depth]
      : [size.length, size.across, size.depth];
    const front = rope ? Math.min(size.across, size.depth) / 2 : size.depth / 2;
    const onWall = typeof light.parameters.hostWallId === "string" && light.parameters.hostWallId !== "";
    if (rope) {
      parts.push(cylinder("cylinder", { radiusTop: front, radiusBottom: front, height: size.length, segments: 20 }, at(0, 0, 0, [0, 0, 90]), size.body, 0, 0.45));
    } else {
      parts.push(box(span, at(0, 0, 0), size.body, size.metal, 0.38));
    }
    parts.push(box([span[0] * 0.86, Math.max(span[1] * 0.62, 0.004), 0.003], at(0, 0, -(front + 0.001)), glowColor, 0, 0.32, glow));
    if (emits) {
      const sizeM = { width: span[0], height: Math.max(span[1], 0.01) };
      lights.push(area(`${light.id}:emit`, "emitter", at(0, 0, -(front + 0.006)), sizeM, light, size.intensity, cast));
      if (onWall) {
        lights.push(area(
          `${light.id}:halo`,
          "halo",
          at(0, 0, -(front + STRIP_HALO_STANDOFF_M), [0, 180, 0]),
          sizeM,
          light,
          size.intensity * LIGHT_RENDER_SCALE.stripHaloShare,
          cast,
        ));
      }
    }
    return { parts, lights };
  }

  if (kind === "panel") {
    parts.push(box([size.length, size.across, size.depth], at(0, 0, 0), size.body, 0.12, 0.46));
    parts.push(box([size.length * 0.94, size.across * 0.94, 0.004], at(0, 0, -(size.depth / 2 + 0.001)), glowColor, 0, 0.3, glow));
    if (emits) {
      lights.push(area(`${light.id}:emit`, "emitter", at(0, 0, -(size.depth / 2 + 0.008)), { width: size.length, height: size.across }, light, size.intensity, cast));
    }
    return { parts, lights };
  }

  if (kind === "cob" || kind === "ceiling-downlight") {
    const radius = Math.max(size.length, size.across) / 2;
    parts.push(cylinder("cylinder", { radiusTop: radius, radiusBottom: radius * 0.82, height: size.depth, segments: 28 }, at(0, 0, size.depth / 2, [90, 0, 0]), size.body, size.metal, 0.34));
    parts.push(cylinder("cylinder", { radiusTop: radius * 0.72, radiusBottom: radius * 0.72, height: 0.004, segments: 28 }, at(0, 0, -0.001, [90, 0, 0]), glowColor, 0, 0.28, glow));
    if (emits) {
      lights.push({
        kind: "spot",
        id: `${light.id}:spot`,
        role: "head",
        local: at(0, 0, -0.012),
        color: light.color,
        kelvin: kelvinOf(light),
        candela: size.intensity,
        beamAngleDeg: beamAngleDeg(light),
        penumbra: 0.65,
        rangeM: size.range,
        castShadow: cast,
      });
    }
    return { parts, lights };
  }

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

  // Unknown fixture kind: body only, no light, so nothing invents illumination.
  parts.push(box([size.length, size.across, size.depth], at(0, 0, 0), size.body, size.metal, 0.4));
  return { parts, lights };
}

export function fixtureForCycles(light: LightEntity): CyclesFixture | null {
  const kind = light.parameters.fixtureKind;
  if (!isLightFixtureKind(kind)) return null;
  const size = fixtureSize(light);
  const { parts, lights } = fixtureParts(light, kind, size);
  const group: CyclesTransform = {
    position: metres(light.position),
    rotation: { x: light.rotation.x, y: light.rotation.y, z: light.rotation.z, order: "YXZ" },
  };
  return {
    lightId: light.id,
    name: light.name,
    fixtureKind: kind,
    enabled: light.enabled,
    brightness: light.intensity,
    group,
    parts,
    lights,
  };
}

function targetOf(light: LightEntity): CyclesVec3 {
  const x = light.parameters.targetXMm;
  const y = light.parameters.targetYMm;
  const z = light.parameters.targetZMm;
  if (typeof x === "number" && typeof z === "number") {
    return { x: x / 1000, y: typeof y === "number" ? y / 1000 : 0, z: z / 1000 };
  }
  // three.js aims a DirectionalLight at the origin unless a target is set.
  return { x: 0, y: 0, z: 0 };
}

/** Recipe lights the viewport renders through `SceneProjectLights`, scaled by the mood like the viewport. */
export function recipeLightForCycles(light: LightEntity, roomLightScale: number): CyclesRecipeLight | null {
  if (isLightFixtureKind(light.parameters.fixtureKind)) return null;
  if (!light.enabled) return null;
  const positionM = metres(light.position);
  if (light.kind === "ambient") {
    return { kind: "ambient", id: light.id, name: light.name, color: light.color, intensity: light.intensity * LIGHT_RENDER_SCALE.recipeAmbientScale * roomLightScale };
  }
  if (light.kind === "directional") {
    return {
      kind: "sun",
      id: light.id,
      name: light.name,
      positionM,
      targetM: targetOf(light),
      color: light.color,
      lux: light.intensity * LIGHT_RENDER_SCALE.recipeDirectionalScale * roomLightScale,
      castShadow: light.parameters.castShadow === true,
    };
  }
  if (light.kind === "point") {
    return { kind: "point", id: light.id, name: light.name, positionM, color: light.color, candela: light.intensity * roomLightScale, rangeM: Number(light.parameters.rangeMm ?? 5000) / 1000 };
  }
  if (light.kind === "spot") {
    return { kind: "spot", id: light.id, name: light.name, positionM, color: light.color, candela: light.intensity * roomLightScale, beamAngleDeg: 90, penumbra: 0.5 };
  }
  const rotation: CyclesEuler = { x: light.rotation.x, y: light.rotation.y, z: light.rotation.z, order: "XYZ" };
  return {
    kind: "area",
    id: light.id,
    name: light.name,
    world: { position: positionM, rotation },
    sizeM: { width: Number(light.parameters.widthMm ?? 1200) / 1000, height: Number(light.parameters.heightMm ?? 900) / 1000 },
    color: light.color,
    nits: light.intensity * roomLightScale,
  };
}

/** The window keys the hero path uses at presentation quality, scaled by the mood like the viewport. */
export function windowKeysForCycles(scene: CompiledLivingRoomScene, roomLightScale: number): CyclesWindowKey[] {
  return resolveWindowKeyLights({
    openings: scene.windowOpenings,
    roomCenterMm: scene.bounds.center,
    recipeId: scene.lightingRecipeId,
    mode: "hero",
    quality: "presentation",
  }).map((key) => ({
    id: key.id,
    openingId: key.openingId,
    positionM: metres(key.positionMm),
    targetM: metres(key.targetMm),
    color: key.color,
    lux: key.intensity * roomLightScale,
    castShadow: key.castShadow,
  }));
}
