import { measureLengthMm } from "./planMeasure";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";
import type { Point2Mm } from "../interiorProject";

const MIN_SEGMENT_MM = 1;
const MIN_KNOWN_MM = 1;
const MIN_UNDERLAY_MM = 100;

/**
 * Parse a user-entered known length (mm).
 * Trims, optionally strips a trailing `mm`/`MM` unit suffix, and removes
 * thousands separators (commas / thin spaces between digits). Does not strip
 * minus signs or letters that would mutate scientific notation (e.g. `1e3`).
 */
export function parseKnownLengthMm(raw: string): number {
  let s = raw.trim();
  // Optional trailing unit suffix: "3200 mm", "3200MM"
  s = s.replace(/\s*mm\b/i, "");
  // Thousands separators between digits: "3,200" / "3 200" / thin space
  s = s.replace(/(?<=\d)[,\u2009\u202F\u00A0 ]+(?=\d)/g, "");
  const known = Number(s);
  if (!(Number.isFinite(known) && known >= MIN_KNOWN_MM)) {
    throw new Error("Enter a known length in millimetres.");
  }
  return known;
}

/**
 * Scale underlay so the world-space distance between pointA and pointB
 * equals knownLengthMm. Aspect ratio preserved; pose/opacity/lock flags kept.
 *
 * Image scales about its centre (xMm, zMm). To keep the feature under point A
 * from drifting, the centre is translated:
 *   C' = A - factor * (A - C)
 */
export function calibrateUnderlayScale(
  underlay: LivingRoomPlanUnderlay,
  pointA: Point2Mm,
  pointB: Point2Mm,
  knownLengthMm: number,
): LivingRoomPlanUnderlay {
  const currentDist = measureLengthMm(pointA, pointB);
  if (!(currentDist >= MIN_SEGMENT_MM)) {
    throw new Error("Calibration points are too close. Pick a longer known distance.");
  }
  const known = Number(knownLengthMm);
  if (!(Number.isFinite(known) && known >= MIN_KNOWN_MM)) {
    throw new Error("Enter a known length in millimetres.");
  }
  const factor = known / currentDist;
  const widthMm = underlay.widthMm * factor;
  const heightMm = underlay.heightMm * factor;
  if (widthMm < MIN_UNDERLAY_MM || heightMm < MIN_UNDERLAY_MM) {
    throw new Error(
      "Calibration would make the underlay too small. Use a longer known distance or different points.",
    );
  }
  const cx = underlay.xMm ?? 0;
  const cz = underlay.zMm ?? 0;
  // Preserve point A: after scale-about-centre, same feature stays at A.
  const xMm = pointA.x - factor * (pointA.x - cx);
  const zMm = pointA.z - factor * (pointA.z - cz);
  return {
    ...underlay,
    widthMm,
    heightMm,
    xMm,
    zMm,
    calibrated: true,
  };
}
