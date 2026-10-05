import type { CabinetType } from "../cabinetCapabilities";

/**
 * Sliding wardrobe shutter defaults (docs/APARTMENT_TEMPLATES_ROADMAP.md §3.4, D10).
 *
 * Q4 (Ilyas): which track does the factory buy? Until he answers we build with
 * industry defaults: bottom-rolling double track, 40 mm overlap, 90 mm track
 * allowance, 40 mm height deduction. Every sliding hardware line is flagged
 * "unconfirmed default" while `confirmed` is false.
 */
export type SlidingTrackKind = "bottom-roll" | "top-hung";
export type SlidingLeafCount = 2 | 3;

export const SLIDING_DEFAULTS = {
  trackKind: "bottom-roll" as SlidingTrackKind,
  /** ≈ vertical profile width; typical 30–50. */
  overlapMm: 40,
  /** Double track in front of the carcass; typical 75–100. */
  trackAllowanceMm: 90,
  /** Track + roller clearance off the opening height. */
  heightDeductionMm: 40,
  /** Picks the leaf count from the wardrobe width. */
  maxLeafWidthMm: 1000,
  /** D10: flagged until a factory confirms the values above. */
  confirmed: false,
} as const;

export const SLIDING_OVERLAP_RANGE = { min: 20, max: 80 } as const;
export const SLIDING_TRACK_ALLOWANCE_RANGE = { min: 60, max: 150 } as const;

/** Object parameter keys (per-cabinet overrides). */
export const WARDROBE_DOORS_PARAMETER = "wardrobeDoors";
export const SLIDING_LEAF_COUNT_PARAMETER = "slidingLeafCount";
export const SLIDING_OVERLAP_PARAMETER = "slidingOverlapMm";
export const SLIDING_TRACK_KIND_PARAMETER = "slidingTrackKind";
export const SLIDING_TRACK_ALLOWANCE_PARAMETER = "slidingTrackAllowanceMm";

/** Hardware ids scheduled for sliding wardrobes. */
export const SLIDING_TRACK_HARDWARE: Record<SlidingTrackKind, string> = {
  "bottom-roll": "sliding-track-bottom-roll",
  "top-hung": "sliding-track-top-hung",
};
export const SLIDING_ROLLER_HARDWARE: Record<SlidingTrackKind, string> = {
  "bottom-roll": "sliding-roller-set-bottom",
  "top-hung": "sliding-roller-set-top",
};
/** Flush (recessed) pull: a projecting handle would hit the leaf passing in front. */
export const SLIDING_PULL_ID = "sliding-flush-pull";

/** Construction-spec shape; absent on a cabinet = hinged doors. */
export type SlidingDoorSpec = {
  /** Absent = picked from width (`clamp(ceil(W / maxLeafWidthMm), 2, 3)`). */
  leafCount?: SlidingLeafCount;
  overlapMm: number;
  trackKind: SlidingTrackKind;
  trackAllowanceMm: number;
};

/** Scope (§3.4): wardrobes only in v1. */
export function supportsSlidingDoors(type: CabinetType): boolean {
  return type === "almirah";
}

function clampNumber(value: unknown, range: { min: number; max: number }, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (value === undefined || value === "" || !Number.isFinite(numeric)) return fallback;
  return Math.round(Math.min(range.max, Math.max(range.min, numeric)));
}

export function readSlidingLeafCount(value: unknown): SlidingLeafCount | undefined {
  const numeric = Number(value);
  return numeric === 2 || numeric === 3 ? numeric : undefined;
}

export function normalizeSlidingDoorSpec(value: unknown): SlidingDoorSpec {
  const raw = (value ?? {}) as Partial<Record<keyof SlidingDoorSpec, unknown>>;
  const leafCount = readSlidingLeafCount(raw.leafCount);
  return {
    ...(leafCount ? { leafCount } : {}),
    overlapMm: clampNumber(raw.overlapMm, SLIDING_OVERLAP_RANGE, SLIDING_DEFAULTS.overlapMm),
    trackKind: raw.trackKind === "top-hung" ? "top-hung" : SLIDING_DEFAULTS.trackKind,
    trackAllowanceMm: clampNumber(
      raw.trackAllowanceMm, SLIDING_TRACK_ALLOWANCE_RANGE, SLIDING_DEFAULTS.trackAllowanceMm,
    ),
  };
}

/** Normalised construction-spec field: only wardrobes carry sliding doors. */
export function slidingDoorsField(type: CabinetType, value: unknown): { sliding?: SlidingDoorSpec } {
  if (!value || !supportsSlidingDoors(type)) return {};
  return { sliding: normalizeSlidingDoorSpec(value) };
}

/** Leaf count from width unless overridden: `clamp(ceil(W / maxLeafWidthMm), 2, 3)`. */
export function slidingLeafCount(widthMm: number, spec: Pick<SlidingDoorSpec, "leafCount">): SlidingLeafCount {
  if (spec.leafCount) return spec.leafCount;
  const count = Math.ceil(widthMm / SLIDING_DEFAULTS.maxLeafWidthMm);
  return count <= 2 ? 2 : 3;
}

/** Leaf width: `(W + overlap × (n − 1)) / n`. */
export function slidingLeafWidth(widthMm: number, leafCount: number, overlapMm: number): number {
  return (widthMm + overlapMm * (leafCount - 1)) / leafCount;
}
