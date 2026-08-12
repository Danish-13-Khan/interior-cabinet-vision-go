import type { RenderQuality, RenderSettings } from "../../interiorProject";
import { RENDER_PRESET_DEFINITIONS, MODEL_VIEW_DEFAULT_PRESET_ID } from "./definitions";
import { isRenderPresetId, type RenderPresetBehavior } from "./types";

const byId = new Map<RenderQuality, RenderPresetBehavior>(
  RENDER_PRESET_DEFINITIONS.map((preset) => [preset.id, preset]),
);

/** Resolve a stored quality id to full preset behavior (unknown → standard). */
export function getRenderPresetBehavior(
  quality: RenderQuality | string | null | undefined,
): RenderPresetBehavior {
  if (quality && byId.has(quality as RenderQuality)) {
    return byId.get(quality as RenderQuality)!;
  }
  return byId.get("standard")!;
}

export function listRenderPresetBehaviors() {
  return [...RENDER_PRESET_DEFINITIONS];
}

export function listModelViewRenderPresets() {
  return RENDER_PRESET_DEFINITIONS.filter((preset) => preset.modelViewSafe);
}

/** Patch settings when the user picks a named quality preset. */
export function applyRenderPresetToSettings(
  current: RenderSettings,
  quality: RenderQuality,
): RenderSettings {
  const preset = getRenderPresetBehavior(quality);
  return {
    ...current,
    quality: preset.id,
    widthPx: preset.widthPx,
    heightPx: preset.heightPx,
    transparentBackground: preset.allowTransparentBackground
      ? current.transparentBackground
      : false,
  };
}

export function resolveStudioRenderMode(quality: RenderQuality) {
  return getRenderPresetBehavior(quality).renderMode;
}

export function normalizeStoredRenderQuality(value: unknown): RenderQuality {
  return isRenderPresetId(value) ? value : "standard";
}

export function getModelViewDefaultPresetId() {
  return MODEL_VIEW_DEFAULT_PRESET_ID;
}

/** Legacy RenderQualityPreset shape used by lighting / capture code. */
export function toLegacyQualityPreset(behavior: RenderPresetBehavior) {
  return {
    id: behavior.id,
    name: behavior.name,
    description: behavior.description,
    shadowMapSize: behavior.shadowMapSize,
    contactShadowResolution: behavior.contactShadowResolution,
    pixelRatio: behavior.pixelRatio,
    environmentResolution: behavior.environmentResolution,
    shadowRadius: behavior.shadowRadius,
    renderScale: behavior.renderScale,
    maximumRenderPixels: behavior.maximumRenderPixels,
  };
}
