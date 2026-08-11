import type {
  CameraEntity,
  InteriorProject,
  RenderQuality,
  RenderSettings,
} from "../interiorProject";

export type RenderOutputPreset = {
  id: "hd" | "full-hd" | "qhd" | "uhd";
  name: string;
  widthPx: number;
  heightPx: number;
};

export type RenderQualityPreset = {
  id: RenderQuality;
  name: string;
  description: string;
  shadowMapSize: number;
  contactShadowResolution: number;
};

export const RENDER_OUTPUT_PRESETS = [
  { id: "hd", name: "HD", widthPx: 1280, heightPx: 720 },
  { id: "full-hd", name: "Full HD", widthPx: 1920, heightPx: 1080 },
  { id: "qhd", name: "QHD", widthPx: 2560, heightPx: 1440 },
  { id: "uhd", name: "4K UHD", widthPx: 3840, heightPx: 2160 },
] as const satisfies readonly RenderOutputPreset[];

export const RENDER_QUALITY_PRESETS = [
  {
    id: "draft",
    name: "Draft",
    description: "Fast camera and composition check.",
    shadowMapSize: 512,
    contactShadowResolution: 256,
  },
  {
    id: "standard",
    name: "Standard",
    description: "Balanced interactive presentation output.",
    shadowMapSize: 1024,
    contactShadowResolution: 512,
  },
  {
    id: "presentation",
    name: "Presentation",
    description: "High-detail final image with refined shadows.",
    shadowMapSize: 2048,
    contactShadowResolution: 1024,
  },
] as const satisfies readonly RenderQualityPreset[];

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
};

export function getRenderQualityPreset(quality: RenderQuality) {
  return RENDER_QUALITY_PRESETS.find((preset) => preset.id === quality)!;
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
