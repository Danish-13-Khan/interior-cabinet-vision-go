import type { CameraEntity, RenderComposition } from "../interiorProject";
import type { RenderMode } from "./renderAssetContracts";
import type { CompiledSceneBounds } from "./sceneTypes";

export type HeroFocalPresetId = "wide" | "seating" | "television" | "detail" | "default";

export type HeroFocalPreset = {
  id: HeroFocalPresetId;
  fieldOfViewDegrees: number;
  pullBack: number;
  /** Standing eye height for living-room hero stills. */
  eyeHeightMm: number;
  targetHeightMm: number;
};

/** Presentation focals — eye-level first, avoid ceiling-weighted crops. */
export const HERO_FOCAL_PRESETS: Record<HeroFocalPresetId, HeroFocalPreset> = {
  wide: { id: "wide", fieldOfViewDegrees: 42, pullBack: 1.05, eyeHeightMm: 1560, targetHeightMm: 700 },
  seating: { id: "seating", fieldOfViewDegrees: 38, pullBack: 1.04, eyeHeightMm: 1520, targetHeightMm: 680 },
  television: { id: "television", fieldOfViewDegrees: 40, pullBack: 1.03, eyeHeightMm: 1500, targetHeightMm: 920 },
  detail: { id: "detail", fieldOfViewDegrees: 36, pullBack: 1.02, eyeHeightMm: 1380, targetHeightMm: 860 },
  default: { id: "default", fieldOfViewDegrees: 39, pullBack: 1.04, eyeHeightMm: 1540, targetHeightMm: 690 },
};

function inferHeroFocalPreset(camera: CameraEntity): HeroFocalPreset {
  const name = camera.name.toLowerCase();
  if (name.includes("tv") || name.includes("millwork")) return HERO_FOCAL_PRESETS.television;
  if (name.includes("wide") || name.includes("corner") || name.includes("establish")) {
    return HERO_FOCAL_PRESETS.wide;
  }
  if (name.includes("detail") || name.includes("lamp")) return HERO_FOCAL_PRESETS.detail;
  if (name.includes("seat") || name.includes("sofa") || name.includes("eye-level")) {
    return HERO_FOCAL_PRESETS.seating;
  }
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
  const name = camera.name.toLowerCase();
  const isWide = name.includes("wide") || name.includes("corner") || name.includes("establish");
  const isTelevision = name.includes("tv") || name.includes("millwork");
  const isDetail = name.includes("detail") || name.includes("lamp");
  const width = bounds.size.widthMm;
  const depth = bounds.size.depthMm;
  const center = bounds.center;
  if (isTelevision) {
    return {
      ...camera,
      position: { x: center.x, y: 1500, z: center.z + depth * 0.42 },
      target: { x: center.x, y: 920, z: center.z - depth * 0.42 },
      fieldOfViewDegrees: 42,
    };
  }
  if (isDetail) {
    return {
      ...camera,
      position: {
        x: center.x + width * 0.22,
        y: 1380,
        z: center.z + depth * 0.08,
      },
      target: {
        x: center.x + width * 0.28,
        y: 860,
        z: center.z - depth * 0.18,
      },
      fieldOfViewDegrees: 36,
    };
  }
  return {
    ...camera,
    position: {
      x: center.x + width * (isWide ? 0.2 : 0.16),
      y: isWide ? 1560 : 1520,
      z: center.z + depth * (isWide ? 0.76 : 0.66),
    },
    target: {
      x: center.x - width * 0.04,
      y: isWide ? 700 : 680,
      z: center.z - depth * (isWide ? 0.04 : 0.01),
    },
    fieldOfViewDegrees: isWide ? 44 : 40,
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
