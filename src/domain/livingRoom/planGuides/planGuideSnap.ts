import type { Point2Mm } from "../../interiorProject";
import type { PlanGuide } from "./planGuides";

function nearest(guides: readonly PlanGuide[], axis: PlanGuide["axis"], value: number, toleranceMm: number) {
  let best: number | null = null;
  let bestDistance = toleranceMm;
  for (const guide of guides) {
    if (guide.axis !== axis) continue;
    const distance = Math.abs(guide.positionMm - value);
    if (distance <= bestDistance) {
      best = guide.positionMm;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Pull a drawing point onto guides. `raw` is the unsnapped pointer so the
 * tolerance is measured from where the user pointed, not from the grid result.
 * A point already snapped onto an anchor (existing wall node / DWG point) is
 * kept as-is so new walls still join exactly.
 */
export function snapPointToGuides(
  snapped: Point2Mm,
  raw: Point2Mm,
  guides: readonly PlanGuide[],
  toleranceMm: number,
  anchors: readonly Point2Mm[] = [],
): Point2Mm {
  if (!guides.length || toleranceMm <= 0) return snapped;
  if (anchors.some((anchor) => Math.hypot(anchor.x - snapped.x, anchor.z - snapped.z) < 0.1)) return snapped;
  const x = nearest(guides, "x", raw.x, toleranceMm);
  const z = nearest(guides, "z", raw.z, toleranceMm);
  if (x === null && z === null) return snapped;
  return { x: x ?? snapped.x, z: z ?? snapped.z };
}

/** The automatic site centre line is a fallback for plans without guides. */
export function shouldShowAutoCenterLine(guides: readonly PlanGuide[], showCenterLine: boolean | undefined): boolean {
  return showCenterLine !== false && guides.length === 0;
}
