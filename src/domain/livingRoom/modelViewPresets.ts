import type { CompiledLivingRoomScene } from "./sceneTypes";

export const MODEL_VIEW_PRESETS = [
  {
    id: "perspective",
    label: "Perspective",
    symbol: "◇",
    purpose: "Inspect from the presentation camera — drag to look around",
    clientMode: false,
  },
  {
    id: "isometric",
    label: "Isometric",
    symbol: "⬡",
    purpose: "True orthographic isometric overview of the room",
    clientMode: false,
  },
  {
    id: "front",
    label: "Front",
    symbol: "▤",
    purpose: "Review a straight-on elevation",
    clientMode: false,
  },
  {
    id: "side",
    label: "Side",
    symbol: "▥",
    purpose: "Review the left elevation",
    clientMode: false,
  },
  {
    id: "top",
    label: "Top",
    symbol: "↓",
    purpose: "Check the layout from above",
    clientMode: false,
  },
  {
    id: "dollhouse",
    label: "Dollhouse",
    symbol: "⌂",
    purpose: "See the whole room at a glance",
    clientMode: true,
  },
  {
    id: "orbit",
    label: "Orbit",
    symbol: "↻",
    purpose: "Circle the room to inspect every side",
    clientMode: true,
  },
  {
    id: "walkthrough",
    label: "Walkthrough",
    symbol: "→",
    purpose: "Move through the room at eye level",
    clientMode: true,
  },
] as const;

export type ModelViewPresetId = (typeof MODEL_VIEW_PRESETS)[number]["id"];

/** QA-facing camera row — distinct from Dollhouse / Orbit / Walkthrough. */
export const MODEL_VIEW_PRIMARY_CAMERA_IDS = [
  "perspective",
  "isometric",
  "front",
  "side",
  "top",
] as const satisfies readonly ModelViewPresetId[];

export const MODEL_VIEW_EXPLORE_IDS = [
  "dollhouse",
  "orbit",
  "walkthrough",
] as const satisfies readonly ModelViewPresetId[];

export function getModelViewPreset(presetId: ModelViewPresetId) {
  return MODEL_VIEW_PRESETS.find((preset) => preset.id === presetId)!;
}

export function modelViewUsesOrthographic(preset: ModelViewPresetId): boolean {
  return preset === "isometric";
}

export type ModelViewPose = {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fieldOfViewDegrees: number;
};

export function resolveModelViewPose(
  scene: CompiledLivingRoomScene,
  preset: Exclude<ModelViewPresetId, "perspective" | "walkthrough">,
): ModelViewPose {
  const { center, size } = scene.bounds;
  const span = Math.max(size.widthMm, size.depthMm, size.heightMm, 2400);
  const target = { x: center.x, y: center.y + size.heightMm * 0.18, z: center.z };
  const distance = span * 1.12;

  if (preset === "isometric") {
    const iso = span * 1.28;
    return {
      position: { x: center.x + iso, y: center.y + iso, z: center.z + iso },
      target: { x: center.x, y: center.y + size.heightMm * 0.22, z: center.z },
      fieldOfViewDegrees: 35,
    };
  }
  if (preset === "top") {
    return {
      position: { x: center.x, y: center.y + distance * 1.42, z: center.z + 1 },
      target: { x: center.x, y: 0, z: center.z },
      fieldOfViewDegrees: 38,
    };
  }
  if (preset === "front") {
    return {
      position: { x: center.x, y: target.y + distance * 0.12, z: center.z + distance },
      target,
      fieldOfViewDegrees: 42,
    };
  }
  if (preset === "side") {
    return {
      position: { x: center.x - distance, y: target.y + distance * 0.12, z: center.z },
      target,
      fieldOfViewDegrees: 42,
    };
  }
  if (preset === "dollhouse") {
    return {
      position: {
        x: center.x + distance * 1.18,
        y: center.y + distance * 0.82,
        z: center.z + distance * 1.18,
      },
      target: { x: center.x, y: center.y + size.heightMm * 0.24, z: center.z },
      fieldOfViewDegrees: 42,
    };
  }
  return {
    position: { x: center.x + distance, y: target.y + distance * 0.56, z: center.z + distance },
    target,
    fieldOfViewDegrees: 44,
  };
}

/**
 * Drei OrthographicCamera frustum is ±viewportPx/2 in world units at zoom=1.
 * Zoom so a world span of `spanMm` fills the viewport with padding.
 */
export function orthographicZoomForSpan(
  spanMm: number,
  viewport: { widthPx: number; heightPx: number },
  padding = 1.35,
): number {
  const spanM = Math.max(spanMm, 1200) / 1000;
  const width = Math.max(viewport.widthPx, 1);
  const height = Math.max(viewport.heightPx, 1);
  // Isometric looks along (1,1,1) — inflate span so the projected AABB fits.
  const projected = spanM * Math.SQRT2;
  const zoom = Math.min(width, height) / (projected * padding);
  return Math.max(12, Math.min(480, zoom));
}
