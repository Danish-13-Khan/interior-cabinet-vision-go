import { EMPTY_PLAN_SITE_BOUNDS, type RoomPlanViewBounds } from "../interiorProject/roomPlanBounds";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";
import type { PlanViewBounds } from "./planViewTransform";

export function underlayPlanBounds(underlay: LivingRoomPlanUnderlay | null): PlanViewBounds | null {
  if (!underlay || underlay.hidden) return null;
  const angle = (underlay.rotationDeg ?? 0) * Math.PI / 180;
  const c = Math.cos(angle), s = Math.sin(angle), x = underlay.xMm ?? 0, z = underlay.zMm ?? 0;
  const halfX = underlay.widthMm / 2, halfZ = underlay.heightMm / 2;
  const dx = Math.abs(c) * halfX + Math.abs(s) * halfZ, dz = Math.abs(s) * halfX + Math.abs(c) * halfZ;
  return { minX: x - dx, minZ: z - dz, maxX: x + dx, maxZ: z + dz };
}

export function unionPlanBounds(a: PlanViewBounds, b: PlanViewBounds | null): PlanViewBounds {
  return b
    ? { minX: Math.min(a.minX, b.minX), minZ: Math.min(a.minZ, b.minZ), maxX: Math.max(a.maxX, b.maxX), maxZ: Math.max(a.maxZ, b.maxZ) }
    : a;
}

function toSite(bounds: PlanViewBounds): RoomPlanViewBounds {
  return {
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ,
    centerX: (bounds.minX + bounds.maxX) / 2,
    centerZ: (bounds.minZ + bounds.maxZ) / 2,
    widthMm: bounds.maxX - bounds.minX,
    depthMm: bounds.maxZ - bounds.minZ,
  };
}

/**
 * Grid / Fit envelope. A visible underlay replaces the empty 8 m site so a
 * house plan is not cropped or lost in whitespace.
 */
export function planSiteBoundsForCanvas(
  roomBounds: RoomPlanViewBounds | null,
  underlay: LivingRoomPlanUnderlay | null,
): RoomPlanViewBounds {
  const visible = underlayPlanBounds(underlay);
  if (roomBounds && visible) {
    return toSite(unionPlanBounds({
      minX: roomBounds.minX, minZ: roomBounds.minZ, maxX: roomBounds.maxX, maxZ: roomBounds.maxZ,
    }, visible));
  }
  if (visible) return toSite(visible);
  return roomBounds ?? EMPTY_PLAN_SITE_BOUNDS;
}

export function planCanvasFitBounds(
  roomBounds: RoomPlanViewBounds | null,
  underlay: LivingRoomPlanUnderlay | null,
): PlanViewBounds {
  const site = planSiteBoundsForCanvas(roomBounds, underlay);
  return { minX: site.minX, minZ: site.minZ, maxX: site.maxX, maxZ: site.maxZ };
}

/** Re-fit after import / replace / calibrate — not opacity or lock. */
export function planUnderlayFitKey(underlay: LivingRoomPlanUnderlay | null): string {
  if (!underlay || underlay.hidden) return "none";
  return `${underlay.fileName}:${Math.round(underlay.widthMm)}x${Math.round(underlay.heightMm)}`;
}
