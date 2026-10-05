import type { CabinetConfig } from "../cabinetDimensions";
import { SLIDING_TRACK_ALLOWANCE_RANGE, slidingDoorsField } from "../frontSystem/slidingDefaults";
import { getFamilyDimensionLimits } from "./limits";
import type { FamilyDimensionLimits } from "./types";

/**
 * A hinged almirah stays a ≤ 900 mm carcass (two ~450 mm leaves). A sliding wardrobe is one
 * carcass behind 2–3 shutters on a track that spans the run, so it may be as wide as three
 * leaves (Phase 3, §3.4). Without this the production cut list clamped an 1800 mm sliding
 * wardrobe to 900 mm while 3D, elevations and the hardware schedule used the real width.
 * The depth floor drops by the largest track allowance so the shallower carcass
 * (`depth − trackAllowance`) is never re-clamped back out over the track.
 */
export const SLIDING_WARDROBE_WIDTH_MM = { min: 900, max: 2400, preferredMin: 1200, preferredMax: 2400 } as const;

/** Family limits for this cabinet, widened for sliding wardrobes. */
export function getCabinetDimensionLimits(
  config: Pick<CabinetConfig, "type" | "construction">,
): FamilyDimensionLimits {
  const limits = getFamilyDimensionLimits(config.type);
  if (!slidingDoorsField(config.type, config.construction?.sliding).sliding) return limits;
  return {
    ...limits,
    width: { ...SLIDING_WARDROBE_WIDTH_MM },
    depth: { ...limits.depth, min: limits.depth.min - SLIDING_TRACK_ALLOWANCE_RANGE.max },
  };
}
