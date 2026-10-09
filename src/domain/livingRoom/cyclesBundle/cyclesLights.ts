import type { LightEntity, Point3Mm } from "../../interiorProject";
import { fixtureNumber } from "../lightFixtureProperties";
import { isLightFixtureKind } from "../lightFixtureRegistry";
import {
  fixtureEmissiveIntensity,
  fixtureRenderIntensity,
  LIGHT_RENDER_SCALE,
} from "../lightFixtureTypes";
import { bodyFinish } from "../lightShade";
import { cobShadeFixtureParts } from "./cyclesCobShade";
import { spotFixtureParts } from "./cyclesSpotFixtures";
import { stripFixtureParts } from "./cyclesStripFixtures";
import { at, box, type FixtureSize } from "./cyclesPartHelpers";
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

function metres(point: Point3Mm): CyclesVec3 {
  return { x: point.x / 1000, y: point.y / 1000, z: point.z / 1000 };
}

/** Same table as `readFixtureSize`, at the authored (scale 1) physical intensity. */
function fixtureSize(light: LightEntity): FixtureSize {
  const { body, metal: metalness } = bodyFinish(light);
  return {
    length: Math.max(0.02, fixtureNumber(light, "widthMm", 1000) / 1000),
    across: Math.max(0.004, fixtureNumber(light, "heightMm", 20) / 1000),
    depth: Math.max(0.004, fixtureNumber(light, "depthMm", 20) / 1000),
    body,
    metal: metalness,
    glow: fixtureEmissiveIntensity(light),
    intensity: fixtureRenderIntensity(light, light.kind, 1),
    range: Math.max(0.05, fixtureNumber(light, "rangeMm", 5000) / 1000),
  };
}

function fixtureParts(light: LightEntity, kind: string, size: FixtureSize): { parts: CyclesFixturePart[]; lights: CyclesFixtureLight[] } {
  const glowColor = light.enabled ? light.color : size.body;
  const glow = { color: glowColor, strength: size.glow };
  const emits = light.enabled && light.parameters.emissiveOnly !== true;
  const cast = light.enabled;
  const parts: CyclesFixturePart[] = [];
  const lights: CyclesFixtureLight[] = [];

  const strip = stripFixtureParts(light, kind, size, glowColor, glow, emits, cast);
  if (strip) return strip;
  if (kind === "cob" || kind === "ceiling-downlight") {
    return cobShadeFixtureParts(light, size, glowColor, glow, emits, cast);
  }

  const spot = spotFixtureParts(light, kind, size, glowColor, glow, emits, cast);
  if (spot) return spot;
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
