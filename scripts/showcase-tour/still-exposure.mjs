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

const NEAR_BLACK = 20;
const NEAR_WHITE = 245;

/** @param {Uint8ClampedArray} rgba */
export function readExposure(rgba) {
  let r = 0; let g = 0; let b = 0; let luma = 0; let black = 0; let white = 0;
  const count = rgba.length / 4;
  for (let i = 0; i < rgba.length; i += 4) {
    const y = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
    r += rgba[i]; g += rgba[i + 1]; b += rgba[i + 2]; luma += y;
    if (y < NEAR_BLACK) black += 1;
    if (y > NEAR_WHITE) white += 1;
  }
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

/** Readings outside STILL_EXPOSURE_LIMITS, as human-readable problems. */
export function exposureProblems(reading) {
  return Object.entries(STILL_EXPOSURE_LIMITS)
    .filter(([key, [lo, hi]]) => reading[key] < lo || reading[key] > hi)
    .map(([key, [lo, hi]]) => `${key} ${reading[key].toFixed(2)} outside ${lo}–${hi}`);
}

export function formatExposure(reading) {
  const [r, g, b] = reading.channelMeans.map((value) => value.toFixed(0));
  return `luma ${reading.meanLuma.toFixed(0)}, near-black ${reading.nearBlackPct.toFixed(1)}%, `
    + `near-white ${reading.nearWhitePct.toFixed(1)}%, RGB ${r}/${g}/${b}, cast ${reading.castRatio.toFixed(2)}`;
}
