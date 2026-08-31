/** Millimetre truth for SketchUp-style room authoring. Project units stay `mm`. */

export const PROJECT_UNITS_LABEL = "mm";

export const STANDARD_WALL_HEIGHTS_MM = [2400, 2700, 2800, 3000, 3300] as const;
export const STANDARD_WALL_THICKNESSES_MM = [75, 100, 120, 150, 200] as const;
export const STANDARD_DOOR_HEIGHTS_MM = [2000, 2100, 2200] as const;
export const STANDARD_WINDOW_HEIGHTS_MM = [900, 1200, 1500] as const;
export const STANDARD_SILL_HEIGHTS_MM = [0, 900, 1000, 1100] as const;

export const DEFAULT_WALL_HEIGHT_MM = 2800;
export const DEFAULT_WALL_THICKNESS_MM = 120;
export const DEFAULT_DOOR_HEIGHT_MM = 2100;
export const DEFAULT_WINDOW_HEIGHT_MM = 1200;
export const DEFAULT_WINDOW_SILL_MM = 900;

/** Unraised plan walls compile as a short floor trace until the user raises them. */
export const PLAN_TRACE_HEIGHT_MM = 80;

export function clampWallHeightMm(heightMm: number) {
  return Math.max(1800, Math.min(6000, Math.round(heightMm)));
}

export function clampWallThicknessMm(thicknessMm: number) {
  return Math.max(50, Math.min(500, Math.round(thicknessMm)));
}
