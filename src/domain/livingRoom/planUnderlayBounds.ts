import { EMPTY_PLAN_SITE_BOUNDS, type RoomPlanViewBounds } from "../interiorProject/roomPlanBounds";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";
import { boundsFromPoints, type PlanViewBounds } from "./planViewTransform";

/** Axis-aligned box of the underlay, including pan and rotation. */
export function planUnderlayAabb(underlay: LivingRoomPlanUnderlay): PlanViewBounds {
  const cx = underlay.xMm ?? 0;
  const cz = underlay.zMm ?? 0;
  const hw = underlay.widthMm / 2;
  const hh = underlay.heightMm / 2;
  const rot = ((underlay.rotationDeg ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const corners = [
    { x: -hw, z: -hh },
    { x: hw, z: -hh },
    { x: hw, z: hh },
    { x: -hw, z: hh },
  ].map((point) => ({
    x: cx + point.x * cos - point.z * sin,
    z: cz + point.x * sin + point.z * cos,
  }));
  return boundsFromPoints(corners) ?? { minX: cx - hw, minZ: cz - hh, maxX: cx + hw, maxZ: cz + hh };
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

function unionSite(site: RoomPlanViewBounds, extra: PlanViewBounds): RoomPlanViewBounds {
  const minX = Math.min(site.minX, extra.minX);
  const maxX = Math.max(site.maxX, extra.maxX);
  const minZ = Math.min(site.minZ, extra.minZ);
  const maxZ = Math.max(site.maxZ, extra.maxZ);
  return toSite({ minX, minZ, maxX, maxZ });
}

/**
 * Grid / Fit envelope. A visible underlay replaces the empty 8 m site so a
 * house plan is not cropped or lost in whitespace.
 */
export function planSiteBoundsForCanvas(
  roomBounds: RoomPlanViewBounds | null,
  underlay: LivingRoomPlanUnderlay | null,
): RoomPlanViewBounds {
  const visible = underlay && !underlay.hidden ? planUnderlayAabb(underlay) : null;
  if (roomBounds && visible) return unionSite(roomBounds, visible);
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
