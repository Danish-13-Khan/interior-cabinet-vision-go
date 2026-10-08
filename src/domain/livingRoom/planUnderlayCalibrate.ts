import { measureLengthMm } from "./planMeasure";
import type { LivingRoomPlanUnderlay, UnderlayCalibration } from "./planUnderlay";
import { normalizeUnderlayRotationDeg } from "./planUnderlayTransform";
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
  s = s.replace(/(?<=\d)[,    ]+(?=\d)/g, "");
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
    calibration: { referenceMm: known, mode: "scale" },
  };
}

/** Degrees of the A→B direction in plan coordinates (x right, z down, like the SVG). */
function directionDeg(a: Point2Mm, b: Point2Mm): number {
  return Math.atan2(b.z - a.z, b.x - a.x) * 180 / Math.PI;
}

/**
 * Rotate the image about a world pivot. The SVG draws the image with
 * `translate(centre) rotate(deg)`, so rotating about any other point moves the
 * centre by the same rotation applied to (centre − pivot).
 */
export function rotateUnderlayAbout(
  underlay: LivingRoomPlanUnderlay,
  pivot: Point2Mm,
  deltaDeg: number,
): LivingRoomPlanUnderlay {
  const radians = deltaDeg * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const vx = (underlay.xMm ?? 0) - pivot.x;
  const vz = (underlay.zMm ?? 0) - pivot.z;
  return {
    ...underlay,
    xMm: pivot.x + vx * cos - vz * sin,
    zMm: pivot.z + vx * sin + vz * cos,
    rotationDeg: normalizeUnderlayRotationDeg((underlay.rotationDeg ?? 0) + deltaDeg),
  };
}

export type UnderlayAxis = "horizontal" | "vertical";

/** The smallest turn that makes the A→B direction horizontal or vertical. */
export function axisTurnDeg(a: Point2Mm, b: Point2Mm, axis: UnderlayAxis): number {
  const angle = directionDeg(a, b);
  const targets = axis === "horizontal" ? [0, 180, -180] : [90, -90];
  let best = 0;
  let bestTurn = Number.POSITIVE_INFINITY;
  for (const target of targets) {
    const turn = normalizeUnderlayRotationDeg(target - angle);
    if (Math.abs(turn) < Math.abs(bestTurn)) {
      bestTurn = turn;
      best = turn;
    }
  }
  return best;
}

/**
 * Scale so A→B is `knownLengthMm`, then turn the picture about A so that edge
 * is horizontal or vertical (roadmap §4.4). One commit squares a tilted scan.
 */
export function calibrateUnderlayToAxis(
  underlay: LivingRoomPlanUnderlay,
  pointA: Point2Mm,
  pointB: Point2Mm,
  knownLengthMm: number,
  axis: UnderlayAxis,
): LivingRoomPlanUnderlay {
  const scaled = calibrateUnderlayScale(underlay, pointA, pointB, knownLengthMm);
  const turned = rotateUnderlayAbout(scaled, pointA, axisTurnDeg(pointA, pointB, axis));
  return { ...turned, calibration: { referenceMm: Number(knownLengthMm), mode: axis } };
}

/**
 * Similarity transform that lands the picture edge A→B on a drawn wall: scale
 * so |AB| equals the wall length, turn about A so the edge runs along the wall
 * (whichever wall end gives the smaller turn becomes A's end), then slide A
 * onto that end. Scale, rotation and position in one gesture.
 */
export function calibrateUnderlayToWall(
  underlay: LivingRoomPlanUnderlay,
  pointA: Point2Mm,
  pointB: Point2Mm,
  wallStart: Point2Mm,
  wallEnd: Point2Mm,
): LivingRoomPlanUnderlay {
  const wallLength = measureLengthMm(wallStart, wallEnd);
  if (!(wallLength >= MIN_KNOWN_MM)) throw new Error("That wall is too short to align to.");
  const scaled = calibrateUnderlayScale(underlay, pointA, pointB, wallLength);
  const edgeAngle = directionDeg(pointA, pointB);
  const forward = normalizeUnderlayRotationDeg(directionDeg(wallStart, wallEnd) - edgeAngle);
  const backward = normalizeUnderlayRotationDeg(directionDeg(wallEnd, wallStart) - edgeAngle);
  const useForward = Math.abs(forward) <= Math.abs(backward);
  const turn = useForward ? forward : backward;
  const target = useForward ? wallStart : wallEnd;
  const turned = rotateUnderlayAbout(scaled, pointA, turn);
  return {
    ...turned,
    xMm: (turned.xMm ?? 0) + (target.x - pointA.x),
    zMm: (turned.zMm ?? 0) + (target.z - pointA.z),
    calibration: { referenceMm: wallLength, mode: "wall" },
  };
}

/** Status-line wording for a calibration, e.g. "3,200 mm reference, made horizontal". */
export function describeUnderlayCalibration(calibration: UnderlayCalibration): string {
  const reference = `${Math.round(calibration.referenceMm).toLocaleString("en-US")} mm reference`;
  switch (calibration.mode) {
    case "horizontal": return `${reference}, made horizontal`;
    case "vertical": return `${reference}, made vertical`;
    case "wall": return `${reference}, aligned to the drawn wall`;
    default: return reference;
  }
}
