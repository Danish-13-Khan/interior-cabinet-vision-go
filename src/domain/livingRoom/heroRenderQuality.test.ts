import { describe, expect, it } from "vitest";
import {
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
} from "../interiorProject";
import {
  compileLivingRoomScene,
  createLivingRoomStarterProject,
  createPbrMaterialDescriptor,
  getRenderModeQuality,
  HERO_FOCAL_PRESETS,
  resolveEnvironmentLightingQuality,
  resolveHeroCaptureTuning,
  resolveHeroRenderScale,
  resolveRenderCameraPose,
} from ".";
import { createPbrMaterialDescriptor as createPbr } from "../../rendering/materials/createPbrMaterial";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";

const NOW = "2026-08-12T16:00:00.000Z";

describe("hero render quality", () => {
  it("uses higher anisotropy and material response in hero mode only", () => {
    const preview = getRenderModeQuality("preview");
    const hero = getRenderModeQuality("hero");
    const draftHero = getRenderModeQuality("hero", "draft");
    const clientHero = getRenderModeQuality("hero", "client-preview");
    expect(hero.anisotropy).toBeGreaterThan(preview.anisotropy);
    expect(hero.textureDetail).toBe("high");
    expect(draftHero.textureDetail).toBe("low");
    expect(clientHero.textureDetail).toBe("high");
    expect(hero.envMapIntensityScale).toBeGreaterThan(preview.envMapIntensityScale);
    expect(hero.clearcoatScale).toBeGreaterThan(preview.clearcoatScale);
    expect(hero.roughnessLift).toBeLessThan(0);
  });

  it("applies tighter hero camera framing and focal presets", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const scene = compileLivingRoomScene(project);
    const camera = project.cameras.find((candidate) => candidate.isDefault)!;
    const previewPose = resolveRenderCameraPose(camera, scene.bounds, "architectural", "preview");
    const heroPose = resolveRenderCameraPose(camera, scene.bounds, "architectural", "hero");
    expect(heroPose.fieldOfViewDegrees).toBe(HERO_FOCAL_PRESETS.wide.fieldOfViewDegrees);
    expect(heroPose.fieldOfViewDegrees).toBeLessThan(previewPose.fieldOfViewDegrees);
    expect(Math.hypot(heroPose.position.x - heroPose.target.x, heroPose.position.z - heroPose.target.z))
      .toBeGreaterThan(Math.hypot(previewPose.position.x - previewPose.target.x, previewPose.position.z - previewPose.target.z));
  });

  it("softens hero contact shadows and boosts capture scale", () => {
    const preview = resolveEnvironmentLightingQuality("preview", "standard");
    const hero = resolveEnvironmentLightingQuality("hero", "presentation");
    expect(hero.shadowRadius).toBeGreaterThan(preview.shadowRadius);
    expect(hero.contactShadowBlurScale).toBeGreaterThan(preview.contactShadowBlurScale);
    expect(hero.contactShadowOpacityScale).toBeLessThan(preview.contactShadowOpacityScale);
    expect(resolveHeroRenderScale("hero", "presentation")).toBeGreaterThan(
      resolveHeroRenderScale("preview", "presentation"),
    );
    expect(resolveHeroCaptureTuning("hero", "presentation").vignetteStrength).toBeGreaterThan(0);
  });

  it("tunes hero materials without mutating project JSON", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const snapshot = structuredClone(project);
    const oak = project.materials.find((material) => material.id === LIVING_ROOM_MATERIAL_IDS.naturalOak)!;
    const compiled = {
      id: oak.id,
      name: oak.name,
      kind: oak.kind,
      color: oak.color,
      roughness: oak.roughness,
      metalness: oak.metalness,
      opacity: oak.opacity,
      materialAssetId: oak.id,
      uvScaleMm: 900,
    };
    const preview = createPbr(compiled, "preview");
    const hero = createPbr(compiled, "hero");
    expect(hero.clearcoat).toBeGreaterThan(preview.clearcoat);
    expect(hero.envMapIntensity).toBeGreaterThan(preview.envMapIntensity);
    expect(hero.roughness).toBeLessThan(preview.roughness);
    expect(project).toEqual(snapshot);
    const serialized = serializeInteriorProjectFile(project, NOW);
    expect(JSON.stringify(serialized)).not.toContain("clearcoatScale");
    expect(loadInteriorProjectFile(serialized).document.renderSettings).toEqual(project.renderSettings);
  });
});
