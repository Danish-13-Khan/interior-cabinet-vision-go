/**
 * Grain direction is authored on materials and cabinet part specs and reaches the
 * cutlist. Here it becomes real map rotation so adjacent fronts read as running the
 * same way. Crosswise turns the map a quarter turn on top of any authored rotation.
 */

/** Accepts both the cabinet vocabulary (lengthwise/crosswise) and the shorter room presets. */
const CROSSWISE = new Set(["crosswise", "cross", "width", "widthwise", "horizontal"]);
const LENGTHWISE = new Set(["lengthwise", "length", "vertical"]);

export function grainQuarterTurns(grainDirection?: string): number {
  if (!grainDirection) return 0;
  const value = grainDirection.trim().toLowerCase();
  if (CROSSWISE.has(value)) return 1;
  if (LENGTHWISE.has(value)) return 0;
  return 0;
}

/** Authored UV rotation plus the quarter turn implied by grain direction. */
export function grainRotationDeg(material: {
  uvRotationDeg?: number;
  grainDirection?: string;
}): number {
  return (material.uvRotationDeg ?? 0) + grainQuarterTurns(material.grainDirection) * 90;
}
