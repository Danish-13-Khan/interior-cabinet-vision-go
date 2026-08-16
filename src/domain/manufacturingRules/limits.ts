import type { CabinetType } from "../cabinetCapabilities";
import type { BoardMaterialId } from "../materialSystem";
import type { FamilyDimensionLimits } from "./types";

export const MIN_OPENING_WIDTH_MM = 120;
export const MIN_OPENING_HEIGHT_MM = 180;
export const MIN_SHELF_DEPTH_MM = 120;
export const MIN_SHELF_SPACING_MM = 140;
export const MIN_DRAWER_FRONT_HEIGHT_MM = 100;
export const NARROW_DOOR_WIDTH_MM = 450;
export const SINGLE_DOOR_MAX_WIDTH_MM = 600;
export const DOUBLE_DOOR_MAX_WIDTH_MM = 1100;
export const WALL_MOUNT_MIN_Y_MM = 1200;
export const WALL_MOUNT_MAX_Y_MM = 1800;
export const WALL_MOUNT_CLEARANCE_MM = 100;

/** Max unsupported shelf clear span (mm) by shelf thickness and board material. */
const SHELF_SPAN_LIMITS: Record<BoardMaterialId, Record<number, number>> = {
  ply: { 16: 700, 18: 800, 25: 1000 },
  hdhmr: { 16: 650, 18: 750, 25: 950 },
  mdf: { 16: 550, 18: 650, 25: 850 },
  particle: { 16: 450, 18: 550, 25: 700 },
};

export function getFamilyDimensionLimits(type: CabinetType): FamilyDimensionLimits {
  const global = {
    width: {
      min: 500,
      max: 1800,
      preferredMin: 500,
      preferredMax: 1800,
    },
    height: {
      min: 400,
      max: 2400,
      preferredMin: 400,
      preferredMax: 2400,
    },
    depth: {
      min: 300,
      max: 900,
      preferredMin: 300,
      preferredMax: 900,
    },
  };

  switch (type) {
    case "base":
      return {
        // BPO pull-out carcasses use the same base construction at 250–300 mm.
        width: { min: 250, max: 1200, preferredMin: 600, preferredMax: 900 },
        height: { min: 700, max: 900, preferredMin: 720, preferredMax: 860 },
        depth: { min: 500, max: 650, preferredMin: 540, preferredMax: 600 },
      };
    case "wall":
      return {
        width: { min: 500, max: 1200, preferredMin: 600, preferredMax: 600 },
        // 600 mm is the standard shutter height; taller shutters remain configurable.
        height: { min: 400, max: 2100, preferredMin: 600, preferredMax: 600 },
        depth: { min: 280, max: 400, preferredMin: 350, preferredMax: 350 },
      };
    case "tall":
    case "almirah":
      return {
        width: { min: 450, max: 900, preferredMin: 500, preferredMax: 750 },
        height: { min: 1800, max: 2400, preferredMin: 2000, preferredMax: 2200 },
        depth: { min: 500, max: 700, preferredMin: 560, preferredMax: 650 },
      };
    case "drawer":
      return {
        width: { min: 500, max: 1000, preferredMin: 600, preferredMax: 900 },
        height: { min: 500, max: 900, preferredMin: 700, preferredMax: 860 },
        depth: { min: 450, max: 650, preferredMin: 500, preferredMax: 600 },
      };
    case "sink":
      return {
        width: { min: 600, max: 1200, preferredMin: 800, preferredMax: 1000 },
        height: { min: 700, max: 900, preferredMin: 720, preferredMax: 860 },
        depth: { min: 500, max: 650, preferredMin: 560, preferredMax: 600 },
      };
    case "corner":
      return {
        width: { min: 800, max: 1200, preferredMin: 900, preferredMax: 1100 },
        height: { min: 700, max: 900, preferredMin: 720, preferredMax: 860 },
        depth: { min: 800, max: 1200, preferredMin: 900, preferredMax: 1100 },
      };
    case "open-shelf":
      return {
        width: { min: 500, max: 1200, preferredMin: 600, preferredMax: 1000 },
        height: { min: 600, max: 2100, preferredMin: 700, preferredMax: 1800 },
        depth: { min: 300, max: 450, preferredMin: 320, preferredMax: 400 },
      };
    default:
      return global;
  }
}

export function getMaxUnsupportedShelfSpanMm(
  thicknessMm: number,
  boardMaterialId: BoardMaterialId,
): number {
  const table = SHELF_SPAN_LIMITS[boardMaterialId] ?? SHELF_SPAN_LIMITS.mdf;
  const thicknesses = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  let chosen = thicknesses[0];
  for (const thickness of thicknesses) {
    if (thicknessMm >= thickness) chosen = thickness;
  }
  return table[chosen] ?? 600;
}
