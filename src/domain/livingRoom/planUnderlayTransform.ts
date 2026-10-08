import type { LivingRoomPlanUnderlay } from "./planUnderlay";

/** Normalise to (−180, 180], matching the Rotate field's range. */
export function normalizeUnderlayRotationDeg(degrees: number): number {
  if (!Number.isFinite(degrees)) return 0;
  const wrapped = ((degrees % 360) + 360) % 360;
  return wrapped > 180 ? wrapped - 360 : wrapped;
}

export function rotateUnderlayBy(
  underlay: LivingRoomPlanUnderlay,
  deltaDeg: number,
): LivingRoomPlanUnderlay {
  return {
    ...underlay,
    rotationDeg: normalizeUnderlayRotationDeg((underlay.rotationDeg ?? 0) + deltaDeg),
  };
}

/** Pan to 0 / 0; keeps rotation and scale. */
export function centreUnderlayOnOrigin(underlay: LivingRoomPlanUnderlay): LivingRoomPlanUnderlay {
  return { ...underlay, xMm: 0, zMm: 0 };
}

export function translateUnderlay(
  underlay: LivingRoomPlanUnderlay,
  dxMm: number,
  dzMm: number,
): LivingRoomPlanUnderlay {
  return {
    ...underlay,
    xMm: Math.round((underlay.xMm ?? 0) + dxMm),
    zMm: Math.round((underlay.zMm ?? 0) + dzMm),
  };
}

/** Underlay can take drag gestures only when visible and unlocked. */
export function canMoveUnderlay(underlay: LivingRoomPlanUnderlay | null): underlay is LivingRoomPlanUnderlay {
  return Boolean(underlay && !underlay.locked && !underlay.hidden);
}

/** Replace file keeps the pose only when the new picture has the same shape (S7). */
export const UNDERLAY_ASPECT_CARRY_TOLERANCE = 0.01;

/**
 * Carry position, rotation, size, opacity and calibration from the underlay being
 * replaced onto the newly imported one when both are rasters with matching aspect
 * ratio (within 1 %). Otherwise the fresh import is returned as is.
 */
export function carryUnderlayPose(
  previous: LivingRoomPlanUnderlay | null | undefined,
  next: LivingRoomPlanUnderlay,
): LivingRoomPlanUnderlay {
  if (!previous || previous.sourceType === "dwg" || next.sourceType === "dwg") return next;
  if (!(previous.widthMm > 0 && previous.heightMm > 0 && next.widthMm > 0 && next.heightMm > 0)) return next;
  const previousAspect = previous.widthMm / previous.heightMm;
  const nextAspect = next.widthMm / next.heightMm;
  if (Math.abs(previousAspect - nextAspect) / previousAspect > UNDERLAY_ASPECT_CARRY_TOLERANCE) return next;
  return {
    ...next,
    widthMm: previous.widthMm,
    heightMm: previous.heightMm,
    xMm: previous.xMm ?? 0,
    zMm: previous.zMm ?? 0,
    rotationDeg: previous.rotationDeg ?? 0,
    opacity: previous.opacity,
    calibrated: Boolean(previous.calibrated),
  };
}
