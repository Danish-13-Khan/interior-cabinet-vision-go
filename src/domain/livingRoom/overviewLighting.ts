import type { InteriorProject, LightEntity } from "../interiorProject";
import { isRoomLightFixture } from "./roomLightFixtures";
import type { CompiledSceneBounds } from "./sceneTypes";

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

/** One sun for the union, plus every room fixture as an emissive mesh. */
export function overviewLights(project: InteriorProject, bounds: CompiledSceneBounds): LightEntity[] {
  const fixtures = project.lights
    .filter(isRoomLightFixture)
    .map(overviewFixture)
    .sort((a, b) => a.id.localeCompare(b.id));
  return [overviewSun(bounds), ...fixtures];
}
