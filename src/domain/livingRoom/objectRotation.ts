import { readCabinetIdentity } from "../cabinetIdentity";
import {
  validateInteriorProject,
  type InteriorObjectEntity,
  type InteriorProject,
} from "../interiorProject";
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
  const wrapped = degrees % 360;
  const next = wrapped < 0 ? wrapped + 360 : wrapped;
  return Math.abs(next - 360) < 1e-9 || next === 0 ? 0 : next;
}

/** Display value with at most one decimal, so wall-normal angles read honestly. */
export function formatRotationDeg(degrees: number): string {
  const tenths = Math.round(normalizeRotationDeg(degrees) * 10) % 3600;
  return String(tenths / 10);
}

export const CABINET_OFF_GRID_HINT =
  "This cabinet sits at an angle; rotating it snaps to the nearest 90°.";

/** Cabinet angled by wall placement (e.g. a slanted wall) rather than a quarter turn. */
export function isOffQuarterTurn(object: InteriorObjectEntity): boolean {
  const y = normalizeRotationDeg(object.rotation.y);
  return Math.abs(y - Math.round(y / CABINET_ROTATION_STEP_DEG) * CABINET_ROTATION_STEP_DEG) > 0.5;
}

/** Cabinets land on the nearest quarter turn; every other object keeps the exact angle. */
export function guardRotationFor(object: InteriorObjectEntity, degrees: number): number {
  const normalized = normalizeRotationDeg(degrees);
  if (!rotatesInQuarterTurns(object)) return normalized;
  return normalizeRotationDeg(Math.round(normalized / CABINET_ROTATION_STEP_DEG) * CABINET_ROTATION_STEP_DEG);
}

/** Typed rotation: stored exactly (0–360) for free objects, 90° steps for cabinets. */
export function setLivingRoomObjectRotation(
  project: InteriorProject,
  objectId: string,
  rotationY: number,
): InteriorProject {
  const target = project.objects.find((object) => object.id === objectId);
  if (!target) return project;
  const y = guardRotationFor(target, rotationY);
  if (y === target.rotation.y) return project;
  return validateInteriorProject({
    ...project,
    objects: project.objects.map((object) =>
      object.id === objectId ? { ...object, rotation: { ...object.rotation, y } } : object,
    ),
  }).project;
}
