import type { LivingRoomPlanUnderlay } from './planUnderlay';
import type { PlanViewBounds } from './planViewTransform';
export function underlayPlanBounds(underlay: LivingRoomPlanUnderlay | null): PlanViewBounds | null {
  if (!underlay || underlay.hidden) return null;
  const angle = (underlay.rotationDeg ?? 0)*Math.PI/180;
  const c=Math.cos(angle), s=Math.sin(angle), x=underlay.xMm ?? 0, z=underlay.zMm ?? 0;
  const halfX=underlay.widthMm/2, halfZ=underlay.heightMm/2;
  const dx=Math.abs(c)*halfX+Math.abs(s)*halfZ, dz=Math.abs(s)*halfX+Math.abs(c)*halfZ;
  return { minX:x-dx, minZ:z-dz, maxX:x+dx, maxZ:z+dz };
}
export function unionPlanBounds(a: PlanViewBounds, b: PlanViewBounds | null): PlanViewBounds {
  return b ? { minX:Math.min(a.minX,b.minX),minZ:Math.min(a.minZ,b.minZ),maxX:Math.max(a.maxX,b.maxX),maxZ:Math.max(a.maxZ,b.maxZ) } : a;
}
