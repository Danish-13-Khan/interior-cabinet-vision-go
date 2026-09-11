/**
 * Reproducible Model View perf gate helpers (roadmap §8.4).
 * Collect rAF / R3F frame deltas only — never renderer.info for durations.
 */

/** Nearest-rank p95: index floor(0.95 * (n - 1)) on ascending deltas. */
export function computeFrameTimeP95Ms(deltasMs: readonly number[]): number | null {
  if (deltasMs.length === 0) return null;
  const sorted = [...deltasMs].sort((a, b) => a - b);
  const index = Math.floor(0.95 * (sorted.length - 1));
  return sorted[index]!;
}

export function computeFrameTimeMeanMs(deltasMs: readonly number[]): number | null {
  if (deltasMs.length === 0) return null;
  const sum = deltasMs.reduce((acc, value) => acc + value, 0);
  return sum / deltasMs.length;
}

/** Fail if post p95 exceeds baseline × factor (default 1.25). */
export function exceedsFrameTimeBudget(args: {
  baselineP95Ms: number;
  measuredP95Ms: number;
  factor?: number;
  absoluteCeilingMs?: number;
}): boolean {
  const factor = args.factor ?? 1.25;
  if (args.measuredP95Ms > args.baselineP95Ms * factor) return true;
  if (
    args.absoluteCeilingMs !== undefined
    && args.measuredP95Ms > args.absoluteCeilingMs
  ) {
    return true;
  }
  return false;
}
