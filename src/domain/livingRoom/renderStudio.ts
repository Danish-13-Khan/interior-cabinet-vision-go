import type {
  CameraEntity,
  InteriorProject,
  RenderComposition,
  RenderQuality,
  RenderSettings,
} from "../interiorProject";
import type { CompiledSceneBounds } from "./sceneTypes";

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
  pixelRatio: number;
  environmentResolution: number;
  shadowRadius: number;
  renderScale: number;
  maximumRenderPixels: number;
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
    pixelRatio: 1,
    environmentResolution: 64,
    shadowRadius: 1,
    renderScale: 1,
    maximumRenderPixels: 4_000_000,
  },
  {
    id: "standard",
    name: "Standard",
    description: "Balanced interactive presentation output.",
    shadowMapSize: 1024,
    contactShadowResolution: 512,
    pixelRatio: 1.5,
    environmentResolution: 128,
    shadowRadius: 4,
    renderScale: 1.25,
    maximumRenderPixels: 8_000_000,
  },
  {
    id: "presentation",
    name: "Presentation",
    description: "High-detail final image with refined shadows.",
    shadowMapSize: 2048,
    contactShadowResolution: 1024,
    pixelRatio: 2,
    environmentResolution: 256,
    shadowRadius: 7,
    renderScale: 1.5,
    maximumRenderPixels: 12_000_000,
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
  composition: RenderComposition;
};

export function resolveRenderCameraPose(
  camera: CameraEntity,
  bounds: CompiledSceneBounds,
  composition: RenderComposition,
): CameraEntity {
  if (composition === "project-camera") return camera;
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

export {
  resolveEnvironmentLightingQuality,
  type EnvironmentLightingQuality,
} from "./environmentLightingQuality";
