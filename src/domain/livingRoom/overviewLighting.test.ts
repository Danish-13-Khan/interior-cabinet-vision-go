import { describe, expect, it } from "vitest";
import { APARTMENT_TEMPLATE_IDS, instantiateApartmentTemplate } from "../apartmentTemplates";
import { COMPOSER_TEST_NOW } from "../apartmentTemplates/composers/bareRoom";
import { isRoomLightFixture } from "./roomLightFixtures";
import {
  resolveRoomFitFrustumHalfExtent,
  roomSpanMetersFromSizeMm,
} from "./roomFitShadowFrustum";
import { compileApartmentScene } from "./apartmentScene";
import { computeArchitectureBounds } from "./sceneCompilerBounds";
import {
  OVERVIEW_DIRECTIONAL_LIGHTS,
  OVERVIEW_EXPOSURE,
  OVERVIEW_STAGE_COLOR,
  OVERVIEW_SUN_INTENSITY,
} from "./overviewLighting";
import { shaderProgramCacheKey, shaderSourceTotal, sumShaderCounts } from "./fixtureLightBudget";

const scenes = APARTMENT_TEMPLATE_IDS.map((id) => compileApartmentScene(
  instantiateApartmentTemplate(id, { now: COMPOSER_TEST_NOW }),
));

describe("overview lighting", () => {
  it("uses one sun and no fixture shader lights on every template", () => {
    const keys = scenes.map((scene) => shaderProgramCacheKey(sumShaderCounts(scene.lights)));
    expect(new Set(keys).size).toBe(1);
    expect(shaderSourceTotal(sumShaderCounts(scenes[0]!.lights))).toBe(0);
    for (const scene of scenes) {
      const suns = scene.lights.filter((light) => light.parameters.overview === true);
      expect(suns).toHaveLength(OVERVIEW_DIRECTIONAL_LIGHTS);
      expect(suns[0]!.kind).toBe("directional");
      expect(suns[0]!.intensity).toBe(OVERVIEW_SUN_INTENSITY);
      expect(scene.style.environment.backgroundColor).toBe(OVERVIEW_STAGE_COLOR);
      expect(scene.style.colorManagement.exposure).toBe(OVERVIEW_EXPOSURE);
      expect(suns[0]!.parameters.castShadow).toBe(true);
      expect(suns[0]!.parameters.targetXMm).toBe(scene.bounds.center.x);
      expect(suns[0]!.parameters.targetZMm).toBe(scene.bounds.center.z);
      expect(scene.windowOpenings).toEqual([]);
      expect(scene.lights.some((light) => typeof light.parameters.recipeId === "string")).toBe(false);
      const fixtures = scene.lights.filter(isRoomLightFixture);
      expect(fixtures.length).toBeGreaterThan(0);
      expect(fixtures.every((light) => light.parameters.emissiveOnly === true)).toBe(true);
      const span = roomSpanMetersFromSizeMm(computeArchitectureBounds(scene.nodes).size);
      expect(resolveRoomFitFrustumHalfExtent(span)).toBeGreaterThanOrEqual(span * 0.55);
    }
  });

  it("hosted fixtures follow their host's current position", () => {
    const project = instantiateApartmentTemplate("template:apartment:2bhk:v1", { now: COMPOSER_TEST_NOW });
    const hosted = project.lights.find((light) => isRoomLightFixture(light)
      && typeof light.parameters.hostObjectId === "string" && light.parameters.hostObjectId !== "")!;
    expect(hosted).toBeTruthy();
    const hostId = String(hosted.parameters.hostObjectId);
    // A host moved without re-resolving the light leaves the stored pose behind.
    const moved = {
      ...project,
      objects: project.objects.map((object) => (object.id === hostId
        ? { ...object, position: { ...object.position, x: object.position.x + 500 } }
        : object)),
    };
    const before = compileApartmentScene(project).lights.find((light) => light.id === hosted.id)!;
    const after = compileApartmentScene(moved).lights.find((light) => light.id === hosted.id)!;
    expect(after.position.x - before.position.x).toBeCloseTo(500, 0);
    expect(after.parameters.emissiveOnly).toBe(true);
  });
});
