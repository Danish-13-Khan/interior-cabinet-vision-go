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
