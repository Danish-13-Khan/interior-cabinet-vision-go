import type { ModelViewPresetId } from "./modelViewPresets";

export const WALKTHROUGH_EYE_HEIGHT_MM = 1650;

export type ModelViewCameraOverrides = {
  cameraHeightMm?: number;
  fieldOfViewDegrees?: number;
};

export function modelViewShowsHeightSlider(viewPreset: ModelViewPresetId): boolean {
  return viewPreset === "dollhouse";
}

/** Height slider is dollhouse-only; FOV applies to every preset including perspective. */
export function resolveModelViewCameraOverrides(
  viewPreset: ModelViewPresetId,
  dollhouseHeightMm: number,
  dollhouseFovDegrees: number,
): ModelViewCameraOverrides {
  if (viewPreset === "dollhouse") {
    return { cameraHeightMm: dollhouseHeightMm, fieldOfViewDegrees: dollhouseFovDegrees };
  }
  if (viewPreset === "walkthrough") {
    return { cameraHeightMm: WALKTHROUGH_EYE_HEIGHT_MM, fieldOfViewDegrees: dollhouseFovDegrees };
  }
  return { fieldOfViewDegrees: dollhouseFovDegrees };
}

export function modelViewNavHint(viewPreset: ModelViewPresetId): string {
  if (viewPreset === "walkthrough") {
    return "Click viewport · drag to look · WASD / arrows move · Shift speeds up";
  }
  return "Drag orbit · Right drag pan · Scroll zoom · Drag objects to place";
}
