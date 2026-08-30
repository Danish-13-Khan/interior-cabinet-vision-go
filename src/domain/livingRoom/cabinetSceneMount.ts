import { readCabinetIdentity } from "../cabinetIdentity";
import type { InteriorObjectEntity, Point3Mm } from "../interiorProject";

/** Golden wall-cabinet underside height (mm) when none is authored. */
export const DEFAULT_WALL_CABINET_MOUNT_HEIGHT_MM = 1400;

export function isWallCabinetObject(object: InteriorObjectEntity): boolean {
  return readCabinetIdentity(object)?.cabinetType === "wall";
}

/** Configured underside height for wall cabinets; floor types stay at 0. */
export function resolveWallMountHeightMm(object: InteriorObjectEntity): number {
  if (!isWallCabinetObject(object)) return 0;
  const authored = Number(object.parameters.mountHeightMm);
  if (Number.isFinite(authored) && authored > 0) return Math.round(authored);
  if (object.position.y > 0) return Math.round(object.position.y);
  return DEFAULT_WALL_CABINET_MOUNT_HEIGHT_MM;
}

/** Scene-node origin: wall cabinets sit at mount height even if plan Y is 0. */
export function cabinetScenePosition(object: InteriorObjectEntity): Point3Mm {
  if (!isWallCabinetObject(object)) return { ...object.position };
  return { ...object.position, y: resolveWallMountHeightMm(object) };
}
