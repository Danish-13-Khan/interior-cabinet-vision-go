/**
 * Model View–scoped orthographic shadow frustum from room plan span (Policy A).
 * Studio paths must not call this — they keep fixed STUDIO_PROJECT_SHADOW extents.
 */

export function resolveRoomFitFrustumHalfExtent(
  roomSpanMeters: number,
  baseHalfExtent = 7,
): number {
  const span = Math.max(0, roomSpanMeters);
  // Cover plan diagonal-ish with padding; clamp so tiny rooms stay stable.
  const fitted = span * 0.55 + 1.2;
  return Math.min(22, Math.max(baseHalfExtent, fitted));
}

export function roomSpanMetersFromSizeMm(size: {
  widthMm: number;
  depthMm: number;
}): number {
  return Math.max(size.widthMm, size.depthMm) / 1000;
}
