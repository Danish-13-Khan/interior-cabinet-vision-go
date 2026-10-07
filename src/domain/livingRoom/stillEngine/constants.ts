export const HERO_STILL_ENGINE = {
  id: "stilljob-hero",
  version: "1.0.0",
} as const;

export const HERO_STILL_ENHANCEMENTS = [
  "soft_shadows",
  "material_micro_detail",
  "exposure_grade",
] as const;

/**
 * Phase 2C offline renderer: Blender Cycles driven by `render-sources/blender/render_still.py`.
 * The version pins the Python script's light-unit table and scene-build rules; bump both together.
 */
export const CYCLES_STILL_ENGINE = {
  id: "stilljob-cycles",
  version: "1.0.0",
} as const;

/** Cycles bounces light and shows the sky through openings; it never grades or swaps materials. */
export const CYCLES_STILL_ENHANCEMENTS = [
  "soft_shadows",
  "material_micro_detail",
  "window_background",
] as const;
