import type { Point2Mm } from "../interiorProject";
import type { DwgPlanBounds } from "./dwgUnits";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

/** CAD (x, y-up) → plan (x, z-down) through the underlay image pose. */
export function cadToPlanPoint(
  cad: { x: number; y: number },
  underlay: LivingRoomPlanUnderlay,
  bounds: DwgPlanBounds,
): Point2Mm {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (!(width > 0) || !(height > 0)) {
    throw new Error("DWG bounds are empty.");
  }
  let x = ((cad.x - bounds.minX) / width - 0.5) * underlay.widthMm;
  let z = ((bounds.maxY - cad.y) / height - 0.5) * underlay.heightMm;
  const degrees = underlay.rotationDeg ?? 0;
  if (degrees) {
    const angle = degrees * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotatedX = x * cos - z * sin;
    const rotatedZ = x * sin + z * cos;
    x = rotatedX;
    z = rotatedZ;
  }
  return {
    x: Math.round((x + (underlay.xMm ?? 0)) * 1000) / 1000,
    z: Math.round((z + (underlay.zMm ?? 0)) * 1000) / 1000,
  };
}
