export const SHELF_MIN = 0;
export const SHELF_MAX = 6;
export const DRAWER_MIN = 0;
export const DRAWER_MAX = 8;
export const TOE_KICK_HEIGHT_MIN_MM = 80;
export const TOE_KICK_HEIGHT_MAX_MM = 180;
export const TOE_KICK_INSET_MIN_MM = 20;
export const TOE_KICK_INSET_MAX_MM = 120;
export const FILLER_MAX_MM = 150;
export const DIVIDER_MAX = 3;

export function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}
