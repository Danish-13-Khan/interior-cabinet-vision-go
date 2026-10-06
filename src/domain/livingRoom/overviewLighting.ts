import type { LightEntity } from "../interiorProject";
import { isRoomLightFixture } from "./roomLightFixtures";
import type { CompiledLivingRoomScene, CompiledSceneBounds } from "./sceneTypes";

/**
 * Sources that create three.js lights in the overview. Hemisphere fill and the
 * HDRI stay on the model-view rig (one each, every scene). Preset recipe lights
 * stay out: only the hero room has them, so copying them would light one room
 * and change the count.
 */
export const OVERVIEW_DIRECTIONAL_LIGHTS = 1;

/** Fixtures draw their mesh and add no spot, point, or rect light. */
export function overviewFixture(light: LightEntity): LightEntity {
  return { ...light, parameters: { ...light.parameters, emissiveOnly: true } };
}

function overviewSun(bounds: CompiledSceneBounds): LightEntity {
  const span = Math.max(bounds.size.widthMm, bounds.size.depthMm, 2400);
  return {
    id: "apartment-overview-sun",
    roomId: null,
    name: "Overview sun",
    kind: "directional",
    position: {
      x: bounds.center.x - span * 0.55,
      y: bounds.max.y + span * 0.35,
      z: bounds.center.z + span * 0.55,
    },
    rotation: { x: -48, y: 32, z: 0 },
    color: "#f4f8ff",
    intensity: 0.58,
    enabled: true,
    parameters: {
      castShadow: true,
      targetXMm: bounds.center.x,
      targetYMm: bounds.center.y,
      targetZMm: bounds.center.z,
      overview: true,
    },
  };
}

/**
 * One sun for the union, plus every room fixture as an emissive mesh. Fixtures
 * come from the compiled room scenes, so a hosted fixture (under-cabinet, mirror
 * rope, wall cove) sits where its host is now, not at its stored position.
 */
export function overviewLights(
  roomScenes: readonly CompiledLivingRoomScene[],
  bounds: CompiledSceneBounds,
): LightEntity[] {
  const byId = new Map<string, LightEntity>();
  for (const scene of roomScenes) {
    for (const light of scene.lights) {
      if (isRoomLightFixture(light) && !byId.has(light.id)) byId.set(light.id, overviewFixture(light));
    }
  }
  const fixtures = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  return [overviewSun(bounds), ...fixtures];
}
