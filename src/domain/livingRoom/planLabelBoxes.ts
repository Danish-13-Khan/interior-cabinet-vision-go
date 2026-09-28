/**
 * Axis-aligned text boxes for 2D plan labels (plan millimetres).
 * Plan text is centred (`text-anchor: middle`) with the baseline at `z`.
 */

export type PlanLabelBox = { minX: number; minZ: number; maxX: number; maxZ: number };

/** Average glyph advance for IBM Plex Mono / Sans at 1em (slightly generous). */
const GLYPH_ADVANCE_EM = 0.62;
const ASCENT_EM = 0.8;
const DESCENT_EM = 0.25;

export function estimatePlanLabelWidth(text: string, fontSizeMm: number): number {
  return Math.max(1, text.length) * fontSizeMm * GLYPH_ADVANCE_EM;
}

export function planLabelBox(x: number, z: number, text: string, fontSizeMm: number): PlanLabelBox {
  const half = estimatePlanLabelWidth(text, fontSizeMm) / 2;
  return {
    minX: x - half,
    maxX: x + half,
    minZ: z - fontSizeMm * ASCENT_EM,
    maxZ: z + fontSizeMm * DESCENT_EM,
  };
}

export function padPlanLabelBox(box: PlanLabelBox, padMm: number): PlanLabelBox {
  return {
    minX: box.minX - padMm,
    minZ: box.minZ - padMm,
    maxX: box.maxX + padMm,
    maxZ: box.maxZ + padMm,
  };
}

export function planLabelBoxesOverlap(a: PlanLabelBox, b: PlanLabelBox): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minZ < b.maxZ && b.minZ < a.maxZ;
}

/** Number of overlapping pairs — the Phase 3 exit gate expects zero. */
export function countPlanLabelOverlaps(boxes: readonly PlanLabelBox[]): number {
  let count = 0;
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (planLabelBoxesOverlap(boxes[i], boxes[j])) count += 1;
    }
  }
  return count;
}
