import type { CameraEntity, RenderComposition } from "../interiorProject";
import type { RenderMode } from "./renderAssetContracts";
import type { CompiledSceneBounds } from "./sceneTypes";

export type HeroFocalPresetId = "wide" | "seating" | "television" | "default";

export type HeroFocalPreset = {
  id: HeroFocalPresetId;
  fieldOfViewDegrees: number;
  pullBack: number;
  eyeHeightMm: number;
  targetHeightMm: number;
};

/** Presentation focal lengths — slightly tighter than interactive viewport framing. */
export const HERO_FOCAL_PRESETS: Record<HeroFocalPresetId, HeroFocalPreset> = {
  wide: { id: "wide", fieldOfViewDegrees: 42, pullBack: 1.06, eyeHeightMm: 1520, targetHeightMm: 580 },
  seating: { id: "seating", fieldOfViewDegrees: 38, pullBack: 1.05, eyeHeightMm: 1480, targetHeightMm: 560 },
  television: { id: "television", fieldOfViewDegrees: 40, pullBack: 1.04, eyeHeightMm: 1500, targetHeightMm: 940 },
  default: { id: "default", fieldOfViewDegrees: 39, pullBack: 1.05, eyeHeightMm: 1490, targetHeightMm: 570 },
};

function inferHeroFocalPreset(camera: CameraEntity): HeroFocalPreset {
  const name = camera.name.toLowerCase();
  if (name.includes("tv")) return HERO_FOCAL_PRESETS.television;
  if (name.includes("wide")) return HERO_FOCAL_PRESETS.wide;
  if (name.includes("seat")) return HERO_FOCAL_PRESETS.seating;
  return HERO_FOCAL_PRESETS.default;
}

function applyHeroFraming(camera: CameraEntity): CameraEntity {
  const preset = inferHeroFocalPreset(camera);
  const origin = { x: camera.target.x, y: 0, z: camera.target.z };
  const offset = {
    x: camera.position.x - origin.x,
    y: camera.position.y - origin.y,
    z: camera.position.z - origin.z,
  };
  return {
    ...camera,
    position: {
      x: origin.x + offset.x * preset.pullBack,
      y: preset.eyeHeightMm,
      z: origin.z + offset.z * preset.pullBack,
    },
    target: {
      x: camera.target.x,
      y: preset.targetHeightMm,
      z: camera.target.z,
    },
    fieldOfViewDegrees: preset.fieldOfViewDegrees,
  };
}

function architecturalPose(
  camera: CameraEntity,
  bounds: CompiledSceneBounds,
): CameraEntity {
  const isWide = camera.name.toLowerCase().includes("wide");
  const isTelevision = camera.name.toLowerCase().includes("tv");
  const width = bounds.size.widthMm;
  const depth = bounds.size.depthMm;
  const center = bounds.center;
  if (isTelevision) {
    return {
      ...camera,
      position: { x: center.x, y: 1450, z: center.z + depth * 0.42 },
      target: { x: center.x, y: 980, z: center.z - depth * 0.42 },
      fieldOfViewDegrees: 44,
    };
  }
  return {
    ...camera,
    position: {
      x: center.x + width * (isWide ? 0.2 : 0.17),
      y: Math.min(1650, Math.max(1350, bounds.size.heightMm * (isWide ? 0.55 : 0.5))),
      z: center.z + depth * (isWide ? 0.78 : 0.68),
    },
    target: {
      x: center.x - width * 0.05,
      y: isWide ? 620 : 600,
      z: center.z - depth * (isWide ? 0.05 : 0.01),
    },
    fieldOfViewDegrees: isWide ? 45 : 41,
  };
}

/** Resolve export/viewport camera pose. Hero mode applies presentation framing. */
export function resolveRenderCameraPose(
  camera: CameraEntity,
  bounds: CompiledSceneBounds,
  composition: RenderComposition,
  mode: RenderMode = "preview",
): CameraEntity {
  const base = composition === "project-camera"
    ? camera
    : architecturalPose(camera, bounds);
  return mode === "hero" ? applyHeroFraming(base) : base;
}
