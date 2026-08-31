import type { CompiledLivingRoomScene } from "./sceneTypes";

export const MODEL_VIEW_PRESETS = [
  { id: "dollhouse", label: "Dollhouse", symbol: "⌂", purpose: "See the whole room at a glance", clientMode: true },
  { id: "orbit", label: "Orbit", symbol: "↻", purpose: "Circle the room to inspect every side", clientMode: true },
  { id: "front", label: "Front", symbol: "▤", purpose: "Review a straight-on elevation", clientMode: false },
  { id: "side", label: "Side", symbol: "▥", purpose: "Review the left elevation", clientMode: false },
  { id: "top", label: "Top", symbol: "↓", purpose: "Check the layout from above", clientMode: false },
  { id: "perspective", label: "Perspective", symbol: "◇", purpose: "Inspect from the presentation camera — drag to look around", clientMode: false },
  { id: "walkthrough", label: "Walkthrough", symbol: "→", purpose: "Move through the room at eye level", clientMode: true },
] as const;

export type ModelViewPresetId = (typeof MODEL_VIEW_PRESETS)[number]["id"];

export function getModelViewPreset(presetId: ModelViewPresetId) {
  return MODEL_VIEW_PRESETS.find((preset) => preset.id === presetId)!;
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
      position: { x: center.x + distance * 1.18, y: center.y + distance * 0.82, z: center.z + distance * 1.18 },
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
