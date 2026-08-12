import { describe, expect, it } from "vitest";
import {
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
  type LightEntity,
} from "../interiorProject";
import {
  applyLivingRoomLightingRecipe,
  compileLivingRoomScene,
  createLivingRoomRenderResult,
  createLivingRoomStarterProject,
  getRenderQualityPreset,
  livingRoomRenderFileName,
  matchRenderOutputPreset,
  resolveRenderCameraPose,
  RENDER_OUTPUT_PRESETS,
  RENDER_QUALITY_PRESETS,
} from ".";

const NOW = "2026-08-12T00:00:00.000Z";

describe("living-room Render Studio", () => {
  it("provides constrained quality and output presets", () => {
    expect(RENDER_QUALITY_PRESETS.map((preset) => preset.id)).toEqual([
      "draft",
      "standard",
      "presentation",
      "client-preview",
    ]);
    expect(RENDER_OUTPUT_PRESETS.map((preset) => `${preset.widthPx}x${preset.heightPx}`)).toEqual([
      "1280x720",
      "1920x1080",
      "2560x1440",
      "3840x2160",
    ]);
    expect(getRenderQualityPreset("presentation").shadowMapSize).toBeGreaterThan(
      getRenderQualityPreset("draft").shadowMapSize,
    );
    expect(getRenderQualityPreset("presentation").pixelRatio).toBeGreaterThan(
      getRenderQualityPreset("draft").pixelRatio,
    );
    expect(getRenderQualityPreset("presentation").shadowRadius).toBeGreaterThan(
      getRenderQualityPreset("draft").shadowRadius,
    );
    expect(getRenderQualityPreset("presentation").renderScale).toBeGreaterThan(1);
    expect(getRenderQualityPreset("presentation").maximumRenderPixels).toBeGreaterThan(
      getRenderQualityPreset("draft").maximumRenderPixels,
    );
    expect(getRenderQualityPreset("client-preview").name).toBe("Client Preview");
  });

  it("matches canonical output settings and creates safe filenames", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    expect(matchRenderOutputPreset(project.renderSettings)?.id).toBe("full-hd");
    expect(livingRoomRenderFileName("Client / Living Room", "Wide Room #1")).toBe(
      "client-living-room-wide-room-1.png",
    );
  });

  it("switches a complete light rig without losing custom lights", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const standardIds = project.lights.map((light) => light.id).sort();
    const custom: LightEntity = {
      id: "client-pendant",
      roomId: project.activeRoomId,
      name: "Client Pendant",
      kind: "point",
      position: { x: 0, y: 2200, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      color: "#ffffff",
      intensity: 2,
      enabled: true,
      parameters: { custom: true },
    };
    const changed = applyLivingRoomLightingRecipe(
      { ...project, lights: [...project.lights, custom] },
      "warm-evening",
    );

    expect(changed.renderSettings.lightingRecipeId).toBe("warm-evening");
    expect(changed.lights).toContainEqual(custom);
    expect(changed.lights.filter((light) => light.parameters.recipeId).map((light) => light.id).sort()).toEqual(standardIds);
    expect(changed.lights.filter((light) => light.enabled && light.parameters.recipeId).every((light) => light.parameters.recipeId === "warm-evening")).toBe(true);
  });

  it("captures immutable render metadata from the canonical project", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const scene = compileLivingRoomScene(project);
    const camera = project.cameras.find((candidate) => candidate.isDefault)!;
    const result = createLivingRoomRenderResult({
      dataUrl: "data:image/png;base64,render",
      project,
      sceneFingerprint: scene.fingerprint,
      camera,
      now: NOW,
    });

    expect(result).toMatchObject({
      projectId: project.id,
      sceneFingerprint: scene.fingerprint,
      cameraId: camera.id,
      cameraName: "Wide Room",
      quality: "standard",
      widthPx: 1920,
      heightPx: 1080,
      lightingRecipeId: "neutral-studio",
      transparentBackground: false,
      composition: "architectural",
    });
  });

  it("derives an architectural camera without mutating the saved camera", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const scene = compileLivingRoomScene(project);
    const camera = project.cameras.find((candidate) => candidate.isDefault)!;
    const original = structuredClone(camera);
    const resolved = resolveRenderCameraPose(camera, scene.bounds, "architectural");

    expect(resolved.position.z).toBeGreaterThan(scene.bounds.max.z);
    expect(resolved.fieldOfViewDegrees).toBe(45);
    expect(camera).toEqual(original);
    expect(resolveRenderCameraPose(camera, scene.bounds, "project-camera")).toBe(camera);
  });

  it("persists Render Studio settings through canonical save and reopen", () => {
    const source = createLivingRoomStarterProject({ now: NOW });
    const configured = applyLivingRoomLightingRecipe({
      ...source,
      renderSettings: {
        ...source.renderSettings,
        quality: "presentation",
        widthPx: 2560,
        heightPx: 1440,
        exposure: 1.25,
        transparentBackground: true,
        activeCameraId: source.cameras[1]!.id,
      },
    }, "daylight");
    const loaded = loadInteriorProjectFile(
      serializeInteriorProjectFile(configured, NOW),
    );

    expect(loaded.document.renderSettings).toEqual(configured.renderSettings);
    expect(loaded.document.lights.map((light) => light.enabled)).toEqual(
      configured.lights.map((light) => light.enabled),
    );
  });
});
