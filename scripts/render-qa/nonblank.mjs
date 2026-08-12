/**
 * Shared RGBA nonblank check for render QA scripts.
 * Keep under 200 lines; consume from check-assets / smoke helpers.
 */
export function analyzeRgbaBuffer(data, width, height, options = {}) {
  const blackCeiling = options.blackCeiling ?? 8;
  const minAlpha = options.minAlpha ?? 8;
  const minCoverage = options.minCoverage ?? 0.002;
  const pixelCount = Math.max(0, Math.floor(width) * Math.floor(height));
  if (pixelCount <= 0 || data.length < pixelCount * 4) {
    return { ok: false, coverage: 0, reason: "empty-or-truncated-buffer" };
  }

  let nonblankCount = 0;
  let lumaSum = 0;
  for (let i = 0; i < pixelCount; i += 1) {
    const o = i * 4;
    const r = data[o] ?? 0;
    const g = data[o + 1] ?? 0;
    const b = data[o + 2] ?? 0;
    const a = data[o + 3] ?? 0;
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lumaSum += y;
    const lit = y > blackCeiling || r > blackCeiling || g > blackCeiling || b > blackCeiling;
    if (a >= minAlpha && lit) nonblankCount += 1;
  }

  const coverage = nonblankCount / pixelCount;
  const meanLuma = lumaSum / pixelCount;
  if (coverage < minCoverage) {
    return { ok: false, coverage, meanLuma, reason: "insufficient-coverage" };
  }
  return { ok: true, coverage, meanLuma, reason: null };
}

export function isRgbaBufferNonblank(data, width, height, options) {
  return analyzeRgbaBuffer(data, width, height, options).ok;
}
