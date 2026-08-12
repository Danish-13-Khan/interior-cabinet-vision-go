import type { InteriorProject, Point3Mm } from "../interiorProject";
import { getObjectPlanBounds, getRoomPlanBounds } from "./planGeometry";

export type PlanSnapGuide = {
  axis: "x" | "z";
  valueMm: number;
  kind: "grid" | "center" | "wall" | "object";
};

export type PlanSnapResult = {
  position: Point3Mm;
  guides: PlanSnapGuide[];
};

type SnapTarget = PlanSnapGuide & { positionMm: number };

function nearestTarget(value: number, targets: SnapTarget[], threshold: number) {
  return targets.reduce<SnapTarget | null>((best, target) => {
    const distance = Math.abs(target.positionMm - value);
    if (distance > threshold) return best;
    if (!best || distance < Math.abs(best.positionMm - value)) return target;
    return best;
  }, null);
}

export function snapLivingRoomObject(
  project: InteriorProject,
  objectId: string,
  desired: Point3Mm,
  gridSizeMm = 50,
): PlanSnapResult {
  const object = project.objects.find((item) => item.id === objectId);
  const room = object
    ? project.rooms.find((item) => item.id === object.roomId)
    : null;
  if (!object || !room) return { position: desired, guides: [] };

  const grid = Math.max(10, gridSizeMm);
  const threshold = Math.max(20, grid * 0.6);
  const snapped = {
    ...desired,
    x: Math.round(desired.x / grid) * grid,
    z: Math.round(desired.z / grid) * grid,
  };
  const desiredBounds = getObjectPlanBounds(object, desired);
  const roomBounds = getRoomPlanBounds(room);
  const xTargets: SnapTarget[] = [
    { axis: "x", valueMm: 0, positionMm: 0, kind: "center" },
    {
      axis: "x",
      valueMm: roomBounds.minX,
      positionMm: desired.x + roomBounds.minX - desiredBounds.minX,
      kind: "wall",
    },
    {
      axis: "x",
      valueMm: roomBounds.maxX,
      positionMm: desired.x + roomBounds.maxX - desiredBounds.maxX,
      kind: "wall",
    },
  ];
  const zTargets: SnapTarget[] = [
    { axis: "z", valueMm: 0, positionMm: 0, kind: "center" },
    {
      axis: "z",
      valueMm: roomBounds.minZ,
      positionMm: desired.z + roomBounds.minZ - desiredBounds.minZ,
      kind: "wall",
    },
    {
      axis: "z",
      valueMm: roomBounds.maxZ,
      positionMm: desired.z + roomBounds.maxZ - desiredBounds.maxZ,
      kind: "wall",
    },
  ];

  for (const neighbor of project.objects) {
    if (neighbor.id === objectId || neighbor.roomId !== object.roomId) continue;
    const bounds = getObjectPlanBounds(neighbor);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    for (const valueMm of [bounds.minX, centerX, bounds.maxX]) {
      xTargets.push({
        axis: "x",
        valueMm,
        positionMm: desired.x + valueMm - desiredBounds.minX,
        kind: "object",
      });
      xTargets.push({
        axis: "x",
        valueMm,
        positionMm: desired.x + valueMm - desiredBounds.maxX,
        kind: "object",
      });
      xTargets.push({ axis: "x", valueMm, positionMm: valueMm, kind: "object" });
    }
    for (const valueMm of [bounds.minZ, centerZ, bounds.maxZ]) {
      zTargets.push({
        axis: "z",
        valueMm,
        positionMm: desired.z + valueMm - desiredBounds.minZ,
        kind: "object",
      });
      zTargets.push({
        axis: "z",
        valueMm,
        positionMm: desired.z + valueMm - desiredBounds.maxZ,
        kind: "object",
      });
      zTargets.push({ axis: "z", valueMm, positionMm: valueMm, kind: "object" });
    }
  }

  const xTarget = nearestTarget(desired.x, xTargets, threshold);
  const zTarget = nearestTarget(desired.z, zTargets, threshold);
  const guides: PlanSnapGuide[] = [];
  if (xTarget) {
    snapped.x = xTarget.positionMm;
    guides.push({ axis: "x", valueMm: xTarget.valueMm, kind: xTarget.kind });
  } else if (snapped.x !== desired.x) {
    guides.push({ axis: "x", valueMm: snapped.x, kind: "grid" });
  }
  if (zTarget) {
    snapped.z = zTarget.positionMm;
    guides.push({ axis: "z", valueMm: zTarget.valueMm, kind: zTarget.kind });
  } else if (snapped.z !== desired.z) {
    guides.push({ axis: "z", valueMm: snapped.z, kind: "grid" });
  }
  return { position: snapped, guides };
}

