import type { CompiledLivingRoomScene } from "./sceneTypes";

export const MODEL_VIEW_PRESETS = [
  { id: "dollhouse", label: "Dollhouse" },
  { id: "orbit", label: "Orbit" },
  { id: "front", label: "Front" },
  { id: "top", label: "Top" },
  { id: "perspective", label: "Perspective" },
  { id: "walkthrough", label: "Walkthrough" },
] as const;

export type ModelViewPresetId = (typeof MODEL_VIEW_PRESETS)[number]["id"];

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
