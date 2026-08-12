export type CanvasSampleOptions = {
  /** Max average channel value (0–255) treated as “blank black”. */
  blackCeiling?: number;
  /** Min alpha (0–255) treated as painted. */
  minAlpha?: number;
  /** Min fraction of nonblank pixels required (0–1). */
  minCoverage?: number;
  /** Max channel variance allowed before treating as uniform blank. */
  maxUniformVariance?: number;
};

export type CanvasNonblankResult = {
  ok: boolean;
  pixelCount: number;
  nonblankCount: number;
  coverage: number;
  meanLuma: number;
  reason: string | null;
};

const DEFAULTS = {
  blackCeiling: 8,
  minAlpha: 8,
  minCoverage: 0.002,
  maxUniformVariance: 2.5,
} as const;

function luma(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Inspect RGBA buffer (row-major, 4 bytes/pixel) for a nonblank frame. */
export function analyzeRgbaBuffer(
  data: ArrayLike<number>,
  width: number,
  height: number,
  options: CanvasSampleOptions = {},
): CanvasNonblankResult {
  const blackCeiling = options.blackCeiling ?? DEFAULTS.blackCeiling;
  const minAlpha = options.minAlpha ?? DEFAULTS.minAlpha;
  const minCoverage = options.minCoverage ?? DEFAULTS.minCoverage;
  const maxUniformVariance = options.maxUniformVariance ?? DEFAULTS.maxUniformVariance;
  const pixelCount = Math.max(0, Math.floor(width) * Math.floor(height));
  if (pixelCount <= 0 || data.length < pixelCount * 4) {
    return {
      ok: false,
      pixelCount,
      nonblankCount: 0,
      coverage: 0,
      meanLuma: 0,
      reason: "empty-or-truncated-buffer",
    };
  }

  let nonblankCount = 0;
  let lumaSum = 0;
  let lumaSq = 0;
  for (let i = 0; i < pixelCount; i += 1) {
    const o = i * 4;
    const r = data[o] ?? 0;
    const g = data[o + 1] ?? 0;
    const b = data[o + 2] ?? 0;
    const a = data[o + 3] ?? 0;
    const y = luma(r, g, b);
    lumaSum += y;
    lumaSq += y * y;
    const lit = y > blackCeiling || r > blackCeiling || g > blackCeiling || b > blackCeiling;
    if (a >= minAlpha && lit) nonblankCount += 1;
  }

  const coverage = nonblankCount / pixelCount;
  const meanLuma = lumaSum / pixelCount;
  const variance = lumaSq / pixelCount - meanLuma * meanLuma;
  if (coverage < minCoverage) {
    return {
      ok: false,
      pixelCount,
      nonblankCount,
      coverage,
      meanLuma,
      reason: "insufficient-coverage",
    };
  }
  if (meanLuma <= blackCeiling && variance <= maxUniformVariance) {
    return {
      ok: false,
      pixelCount,
      nonblankCount,
      coverage,
      meanLuma,
      reason: "uniform-black",
    };
  }
  return {
    ok: true,
    pixelCount,
    nonblankCount,
    coverage,
    meanLuma,
    reason: null,
  };
}

/** Quick boolean helper for tests and scripts. */
export function isRgbaBufferNonblank(
  data: ArrayLike<number>,
  width: number,
  height: number,
  options?: CanvasSampleOptions,
) {
  return analyzeRgbaBuffer(data, width, height, options).ok;
}
