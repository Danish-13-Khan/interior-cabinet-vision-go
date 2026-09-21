/**
 * Phase 3 — small shared OrbitControls preset.
 *
 * Only proven commons live here. Viewer vs editor keep separate overrides for
 * damping, distances, framing, and mouse maps — do not auto-unify those.
 */

/** Shared after Phase 1 — vertical pan follows screen space on both canvases. */
export const ORBIT_SCREEN_SPACE_PANNING = true;

/** Model View — longer glide. */
export const MODEL_VIEW_ORBIT_DAMPING_FACTOR = 0.06;

/** CabinetScene editor — quicker settling. */
export const CABINET_SCENE_ORBIT_DAMPING_FACTOR = 0.15;

/** Commons safe to share; canvas-specific fields stay in each component. */
export type OrbitControlsSharedCommons = {
  screenSpacePanning: boolean;
  enableDamping: true;
};

export function resolveOrbitControlsSharedCommons(): OrbitControlsSharedCommons {
  return {
    screenSpacePanning: ORBIT_SCREEN_SPACE_PANNING,
    enableDamping: true,
  };
}

/** Model View–only orbit overrides (not applied to CabinetScene). */
export const modelViewOrbitOverrides = {
  dampingFactor: MODEL_VIEW_ORBIT_DAMPING_FACTOR,
  panSpeed: 1.05,
  zoomSpeed: 1.05,
  rotateSpeed: 0.92,
  zoomToCursor: true,
} as const;

/**
 * CabinetScene editor–only orbit overrides (not applied to Model View).
 * Mouse maps and framing targets remain inline on the component.
 */
export const cabinetSceneOrbitOverrides = {
  dampingFactor: CABINET_SCENE_ORBIT_DAMPING_FACTOR,
  rotateSpeed: 0.8,
  minDistance: 1.1,
  maxDistance: 14,
  target: [0, 0.7, 0] as const,
} as const;
