/**
 * Exposure readout for a card still, from its pixels rather than by eye:
 * mean luminance, share of crushed (near-black) and clipped (near-white)
 * pixels, and per-channel means to catch a colour cast.
 */

/** Acceptable ranges for a daylight card still (sRGB 0–255). */
export const STILL_EXPOSURE_LIMITS = {
  /** Bright is fine for a daylight card; clipping is guarded by nearWhitePct. */
  meanLuma: [95, 190],
  /** A wide living frame holds a black TV screen and dark walnut fronts; crushed shadows push past this. */
  nearBlackPct: [0, 8],
  nearWhitePct: [0, 4],
  /**
   * Largest gap between channel means, as a share of the mean. Warm palettes
   * (walnut, terracotta doors) read about 0.1–0.35 in daylight; a tinted light
   * pushes it far higher (the old evening 2 BHK still read 0.92).
   */
  castRatio: [0, 0.35],
};

/**
 * Evening single-room card stills (D8), read on the room only (the backdrop
 * behind cut-away walls is excluded). The ceiling is high enough for a pale
 * kitchen under warm light (the L-kitchen reads about 150).
 */
export const STILL_EXPOSURE_LIMITS_EVENING = {
  meanLuma: [60, 170],
  nearBlackPct: [0, 12],
  nearWhitePct: [0, 6],
  castRatio: [0, 0.4],
};

/**
 * Apartment card hero: authored wide corner showcase cameras (tour stop 1).
 * More frame area is unlit perimeter + TV void than a catalog room arc, so
 * near-black and warm cast run slightly higher than a tight interior still.
 * Checked by eye on 2026-10-06: the 2 BHK hero (moody walnut) read 19.5%
 * near-black and cast 0.57, the 3 BHK 17.8% and 0.41, and both looked right.
 * Do not widen these without looking at the image that needs it.
 */
export const STILL_EXPOSURE_LIMITS_EVENING_APARTMENT_HERO = {
  meanLuma: [60, 175],
  nearBlackPct: [0, 20],
  nearWhitePct: [0, 8],
  castRatio: [0, 0.6],
};

/**
 * Whole-apartment overview at dusk, read on the apartment only. Measured on
 * the full frame, the pale backdrop hid a near-black walnut 2 BHK (frame mean
 * 174), so the backdrop must be excluded for this to mean anything.
 */
export const STILL_EXPOSURE_LIMITS_PLAN_EVENING = {
  meanLuma: [80, 210],
  nearBlackPct: [0, 10],
  nearWhitePct: [0, 6],
  castRatio: [0, 0.35],
};

const NEAR_BLACK = 20;
const NEAR_WHITE = 245;

const BACKDROP_TOLERANCE = 6;

/**
 * The flat backdrop colour when the frame has one: both top corners match.
 * Interior shots have walls in the corners, which rarely match, so they get none.
 * @param {Uint8ClampedArray} rgba
 * @param {number} width
 */
function backdropColour(rgba, width) {
  const right = (width - 1) * 4;
  const near = [0, 1, 2].every((c) => Math.abs(rgba[c] - rgba[right + c]) <= BACKDROP_TOLERANCE);
  return near ? [rgba[0], rgba[1], rgba[2]] : null;
}

/**
 * @param {Uint8ClampedArray} rgba
 * @param {{ subjectOnly?: boolean, width?: number }} [options] subjectOnly skips
 *   backdrop pixels (needs the frame width), so the reading describes the room or plan.
 */
export function readExposure(rgba, options = {}) {
  let r = 0; let g = 0; let b = 0; let luma = 0; let black = 0; let white = 0;
  const backdrop = options.subjectOnly && options.width ? backdropColour(rgba, options.width) : null;
  let count = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    if (backdrop
      && Math.abs(rgba[i] - backdrop[0]) <= BACKDROP_TOLERANCE
      && Math.abs(rgba[i + 1] - backdrop[1]) <= BACKDROP_TOLERANCE
      && Math.abs(rgba[i + 2] - backdrop[2]) <= BACKDROP_TOLERANCE) continue;
    count += 1;
    const y = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
    r += rgba[i]; g += rgba[i + 1]; b += rgba[i + 2]; luma += y;
    if (y < NEAR_BLACK) black += 1;
    if (y > NEAR_WHITE) white += 1;
  }
  count = Math.max(count, 1);
  const means = [r / count, g / count, b / count];
  const mean = (means[0] + means[1] + means[2]) / 3;
  return {
    meanLuma: luma / count,
    nearBlackPct: (black / count) * 100,
    nearWhitePct: (white / count) * 100,
    channelMeans: means,
    castRatio: (Math.max(...means) - Math.min(...means)) / Math.max(1, mean),
  };
}

/** @param {"day"|"evening"|"evening-apartment-hero"|"plan-evening"} [mood] */
export function exposureLimitsForMood(mood = "day") {
  if (mood === "plan-evening") return STILL_EXPOSURE_LIMITS_PLAN_EVENING;
  if (mood === "evening-apartment-hero") return STILL_EXPOSURE_LIMITS_EVENING_APARTMENT_HERO;
  return mood === "evening" ? STILL_EXPOSURE_LIMITS_EVENING : STILL_EXPOSURE_LIMITS;
}

/**
 * Readings outside limits, as human-readable problems.
 * @param {Partial<typeof STILL_EXPOSURE_LIMITS>} [overrides] per-still exceptions; each needs a reason where it is set.
 */
export function exposureProblems(reading, mood = "day", overrides = {}) {
  const limits = { ...exposureLimitsForMood(mood), ...overrides };
  return Object.entries(limits)
    .filter(([key, [lo, hi]]) => reading[key] < lo || reading[key] > hi)
    .map(([key, [lo, hi]]) => `${key} ${reading[key].toFixed(2)} outside ${lo}–${hi}`);
}

export function formatExposure(reading) {
  const [r, g, b] = reading.channelMeans.map((value) => value.toFixed(0));
  return `luma ${reading.meanLuma.toFixed(0)}, near-black ${reading.nearBlackPct.toFixed(1)}%, `
    + `near-white ${reading.nearWhitePct.toFixed(1)}%, RGB ${r}/${g}/${b}, cast ${reading.castRatio.toFixed(2)}`;
}
