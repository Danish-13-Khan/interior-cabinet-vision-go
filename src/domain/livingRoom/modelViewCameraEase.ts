/** Phase E camera easing + clip helpers (pure — no Three types). */

export const MODEL_VIEW_CAMERA_EASE_MS = 320;

export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

export function lerpNumber(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function lerpPoint3(
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number },
  t: number,
): { x: number; y: number; z: number } {
  return {
    x: lerpNumber(from.x, to.x, t),
    y: lerpNumber(from.y, to.y, t),
    z: lerpNumber(from.z, to.z, t),
  };
}

/** Scale perspective far clip so large plans do not vanish. */
export function resolveModelViewCameraFarMeters(roomSpanMeters: number): number {
  return Math.max(100, roomSpanMeters * 5 + 40);
}

/** Orbit zoom-out ceiling grows with room size. */
export function resolveModelViewOrbitMaxDistance(roomSpanMeters: number): number {
  return Math.max(16, roomSpanMeters * 2.4 + 4);
}

/**
 * Soft floor on polar angle — avoids flipping under the floor.
 * Dollhouse/top stay freer so overview poses are not clipped.
 */
export function resolveModelViewMinPolarAngle(
  viewPreset: string | undefined,
): number {
  if (viewPreset === "dollhouse" || viewPreset === "top" || viewPreset === "orbit") {
    return 0.02;
  }
  return 0.12;
}

/**
 * Wheel zoom fires OrbitControls start+end in one handler.
 * Bump a generation on start; CameraRig latches cancel even after end.
 */
export function consumeOrbitEaseCancelGeneration(
  cancelGeneration: number,
  lastSeenGeneration: number,
): { cancel: boolean; nextSeenGeneration: number } {
  if (cancelGeneration === lastSeenGeneration) {
    return { cancel: false, nextSeenGeneration: lastSeenGeneration };
  }
  return { cancel: true, nextSeenGeneration: cancelGeneration };
}
