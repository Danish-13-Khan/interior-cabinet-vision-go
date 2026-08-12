import type {
  CameraEntity,
  InteriorProject,
  RenderComposition,
  RenderQuality,
  RenderSettings,
} from "../interiorProject";
import {
  getRenderPresetBehavior,
  listRenderPresetBehaviors,
  toLegacyQualityPreset,
} from "./renderPresets";

export type RenderOutputPreset = {
  id: "hd" | "full-hd" | "qhd" | "uhd";
  name: string;
  widthPx: number;
  heightPx: number;
};

/** Backward-compatible quality preset row used by lighting / capture. */
export type RenderQualityPreset = ReturnType<typeof toLegacyQualityPreset>;

export const RENDER_OUTPUT_PRESETS = [
  { id: "hd", name: "HD", widthPx: 1280, heightPx: 720 },
  { id: "full-hd", name: "Full HD", widthPx: 1920, heightPx: 1080 },
  { id: "qhd", name: "QHD", widthPx: 2560, heightPx: 1440 },
  { id: "uhd", name: "4K UHD", widthPx: 3840, heightPx: 2160 },
] as const satisfies readonly RenderOutputPreset[];

/** Derived from the render preset system — includes Client Preview. */
export const RENDER_QUALITY_PRESETS = listRenderPresetBehaviors().map(
  toLegacyQualityPreset,
) as readonly RenderQualityPreset[];

export type LivingRoomRenderResult = {
  id: string;
  dataUrl: string;
  createdAt: string;
  projectId: string;
  sceneFingerprint: string;
  cameraId: string;
  cameraName: string;
  quality: RenderQuality;
  widthPx: number;
  heightPx: number;
  lightingRecipeId: string;
  exposure: number;
  transparentBackground: boolean;
  composition: RenderComposition;
};

export function getRenderQualityPreset(quality: RenderQuality) {
  return toLegacyQualityPreset(getRenderPresetBehavior(quality));
}

export function matchRenderOutputPreset(settings: RenderSettings) {
  return RENDER_OUTPUT_PRESETS.find(
    (preset) => preset.widthPx === settings.widthPx && preset.heightPx === settings.heightPx,
  ) ?? null;
}

export function createLivingRoomRenderResult(args: {
  dataUrl: string;
  project: InteriorProject;
  sceneFingerprint: string;
  camera: CameraEntity;
  now?: string;
}): LivingRoomRenderResult {
  const now = args.now ?? new Date().toISOString();
  return {
    id: `render-${now}-${args.sceneFingerprint}`,
    dataUrl: args.dataUrl,
    createdAt: now,
    projectId: args.project.id,
    sceneFingerprint: args.sceneFingerprint,
    cameraId: args.camera.id,
    cameraName: args.camera.name,
    quality: args.project.renderSettings.quality,
    widthPx: args.project.renderSettings.widthPx,
    heightPx: args.project.renderSettings.heightPx,
    lightingRecipeId: args.project.renderSettings.lightingRecipeId,
    exposure: args.project.renderSettings.exposure,
    transparentBackground: args.project.renderSettings.transparentBackground,
    composition: args.project.renderSettings.composition,
  };
}

function fileSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "interior";
}

export function livingRoomRenderFileName(
  projectName: string,
  cameraName: string,
) {
  return `${fileSlug(projectName)}-${fileSlug(cameraName)}.png`;
}

export { resolveRenderCameraPose } from "./renderCameraPose";
export {
  resolveEnvironmentLightingQuality,
  type EnvironmentLightingQuality,
} from "./environmentLightingQuality";
export {
  getRenderModeQuality,
  resolveHeroCaptureTuning,
  resolveHeroContactShadowTuning,
  resolveHeroRenderScale,
  type HeroCaptureTuning,
  type HeroContactShadowTuning,
} from "./heroRenderQuality";
export {
  applyRenderPresetToSettings,
  getModelViewDefaultPresetId,
  getRenderPresetBehavior,
  listModelViewRenderPresets,
  listRenderPresetBehaviors,
  MODEL_VIEW_DEFAULT_PRESET_ID,
  RENDER_PRESET_DEFINITIONS,
  RENDER_PRESET_IDS,
  resolveStudioRenderMode,
  type RenderPresetBehavior,
} from "./renderPresets";
