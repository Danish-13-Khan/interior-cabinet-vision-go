export const SNAP_PRESETS_MM = [10, 25, 50, 100, 200] as const;

export type SnapPresetMm = (typeof SNAP_PRESETS_MM)[number];

/** Cycle through common snap grid presets. */
export function cycleSnapSizeMm(current: number): SnapPresetMm {
  const index = SNAP_PRESETS_MM.findIndex((size) => size === current);
  if (index < 0) return 50;
  return SNAP_PRESETS_MM[(index + 1) % SNAP_PRESETS_MM.length]!;
}

export function nearestSnapPresetMm(current: number): SnapPresetMm {
  let best: SnapPresetMm = 50;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const size of SNAP_PRESETS_MM) {
    const delta = Math.abs(size - current);
    if (delta < bestDelta) {
      best = size;
      bestDelta = delta;
    }
  }
  return best;
}
