import { describe, expect, it } from "vitest";
import {
  analyzeRgbaBuffer,
  compileLivingRoomScene,
  createLivingRoomStarterProject,
  createObjectRenderBinding,
  resolveEffectiveRenderStrategy,
  resolveRenderCameraPose,
  validateCameraFraming,
} from "..";
import { LIVING_ROOM_MATERIAL_IDS } from "../materials";
import { collectRenderDiagnostics } from "../../../rendering/qa";
import {
  getMaterialAsset,
  getTextureAsset,
  isModelAssetAvailable,
  resolveEnvironmentDrawState,
  resolveNodeDrawStrategy,
} from "../../../rendering/assets/assetRegistry";
import { resolveMaterialTextureUrls } from "../../../rendering/materials/resolveMaterialTextureUrls";

const NOW = "2026-08-12T20:00:00.000Z";

function solidRgba(width: number, height: number, rgba: [number, number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data.set(rgba, i * 4);
  }
  return data;
}

describe("render QA canvas nonblank", () => {
  it("rejects empty and uniform black frames", () => {
    expect(analyzeRgbaBuffer(new Uint8ClampedArray(0), 0, 0).ok).toBe(false);
    const black = solidRgba(16, 16, [0, 0, 0, 255]);
    expect(analyzeRgbaBuffer(black, 16, 16).ok).toBe(false);
    expect(analyzeRgbaBuffer(black, 16, 16).reason).toBe("insufficient-coverage");
  });

  it("accepts frames with visible painted coverage", () => {
    const data = solidRgba(32, 32, [0, 0, 0, 255]);
    for (let i = 0; i < 64; i += 1) {
      data.set([180, 140, 110, 255], i * 4);
    }
    const result = analyzeRgbaBuffer(data, 32, 32);
    expect(result.ok).toBe(true);
    expect(result.coverage).toBeGreaterThan(0.05);
  });
});

describe("render QA camera framing", () => {
  it("validates starter-project active camera framing", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const scene = compileLivingRoomScene(project);
    const camera = scene.cameras.find((item) => item.isDefault) ?? scene.cameras[0];
    const posed = resolveRenderCameraPose(
      camera,
      scene.bounds,
      project.renderSettings.composition,
      "hero",
    );
    const report = validateCameraFraming(posed, scene.bounds);
    expect(report.ok).toBe(true);
    expect(report.issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("flags missing and degenerate cameras", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const scene = compileLivingRoomScene(project);
    expect(validateCameraFraming(null, scene.bounds).ok).toBe(false);
    const bad = {
      ...scene.cameras[0],
      position: { ...scene.cameras[0].position },
      target: { ...scene.cameras[0].position },
      fieldOfViewDegrees: 120,
    };
    const report = validateCameraFraming(bad, scene.bounds);
    expect(report.ok).toBe(false);
    expect(report.issues.some((issue) => issue.code === "invalid-fov")).toBe(true);
    expect(report.issues.some((issue) => issue.code === "degenerate-look")).toBe(true);
  });
});

describe("render QA asset fallbacks", () => {
  it("collects GLB fallback warnings without throwing when models are unavailable", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const scene = compileLivingRoomScene(project);
    const sofa = project.objects.find((object) => object.catalogItemId === "living:sofa-sectional");
    expect(sofa).toBeUndefined();
    const sectionalBinding = createObjectRenderBinding({
      ...project.objects.find((object) => object.catalogItemId === "living:sofa-3-seat")!,
      catalogItemId: "living:sofa-sectional",
    });
    expect(isModelAssetAvailable(sectionalBinding.modelAssetId)).toBe(false);
    expect(resolveEffectiveRenderStrategy(sectionalBinding, false)).toBe("procedural");
    expect(resolveNodeDrawStrategy(sectionalBinding)).toBe("procedural");

    const camera = scene.cameras[0];
    const report = collectRenderDiagnostics(scene, camera, NOW);
    expect(report.glbNodeCount).toBeGreaterThan(0);
    expect(report.camera.ok).toBe(true);
    expect(() => collectRenderDiagnostics(scene, camera, NOW)).not.toThrow();
  });

  it("keeps missing HDRI / PBR maps on safe fallback paths", () => {
    const dark = resolveEnvironmentDrawState("warm-evening");
    expect(dark.available).toBe(true);
    expect(dark.fallbackRequired).toBe(false);
    expect(() => resolveEnvironmentDrawState("not-a-recipe")).not.toThrow();
    expect(resolveEnvironmentDrawState("not-a-recipe").fallbackRequired).toBe(true);

    const material = getMaterialAsset(LIVING_ROOM_MATERIAL_IDS.naturalOak);
    expect(material).toBeTruthy();
    const urls = resolveMaterialTextureUrls({
      id: material!.id,
      materialAssetId: material!.id,
      name: material!.name,
      kind: material!.kind,
      color: material!.baseColor,
      roughness: material!.roughness,
      metalness: material!.metalness,
      opacity: material!.opacity,
      uvScaleMm: material!.uvScaleMm,
    });
    expect(urls.map).toContain("/textures/");
    if (material!.colorMapId) {
      expect(getTextureAsset(material!.colorMapId)?.available).toBe(true);
    }
  });

  it("reports diagnostics summary fields for starter scene", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const scene = compileLivingRoomScene(project);
    const report = collectRenderDiagnostics(scene, scene.cameras[0], NOW);
    expect(report.sceneFingerprint).toBe(scene.fingerprint);
    expect(report.lightingRecipeId).toBe(scene.lightingRecipeId);
    expect(Array.isArray(report.warnings)).toBe(true);
  });
});
