import { readCabinetIdentity } from "../cabinetIdentity";
import type { InteriorObjectEntity } from "../interiorProject";
import { isWallPanelObject } from "./panelAttachment";

/** Snap used when stepping free objects with arrows or spinners. */
export const ROTATION_STEP_DEG = 15;
/** Production cabinets stay square to their run (`CabinetPlacement.rotation`). */
export const CABINET_ROTATION_STEP_DEG = 90;

export const CABINET_ROTATION_HINT =
  "Cabinets rotate in 90° steps so production stays square to the run.";

/** True for production cabinets: their rotation must stay on 0 / 90 / 180 / 270. */
export function rotatesInQuarterTurns(object: InteriorObjectEntity): boolean {
  if (isWallPanelObject(object)) return false;
  return object.kind === "cabinet" || readCabinetIdentity(object) !== null;
}

export function rotationStepFor(object: InteriorObjectEntity): number {
  return rotatesInQuarterTurns(object) ? CABINET_ROTATION_STEP_DEG : ROTATION_STEP_DEG;
}

/** Normalise to [0, 360). */
export function normalizeRotationDeg(degrees: number): number {
  if (!Number.isFinite(degrees)) return 0;
  const next = ((degrees % 360) + 360) % 360;
  return Math.abs(next - 360) < 1e-9 ? 0 : next;
}

/** Display value with at most one decimal, so wall-normal angles read honestly. */
export function formatRotationDeg(degrees: number): string {
  return String(Math.round(normalizeRotationDeg(degrees) * 10) / 10);
}
