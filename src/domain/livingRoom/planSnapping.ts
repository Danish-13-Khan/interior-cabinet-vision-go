import type { InteriorProject, Point3Mm } from "../interiorProject";
import { polygonCentroid, roomPlanPolygon, selectOpeningsForRoom } from "../interiorProject";
import { cabinetRunForObject } from "./cabinetRunLayout";
import { getObjectPlanBounds, getTopologyRoomPlanBounds } from "./planGeometry";
import { snapObjectToTopologyWall } from "./topologySnapping";

export type PlanSnapGuideKind =
  | "grid"
  | "center"
  | "wall"
  | "wall-centre"
  | "object"
  | "opening"
  | "run";

export type PlanSnapGuide = {
  axis: "x" | "z";
  valueMm: number;
  kind: PlanSnapGuideKind;
  /** Human label shown on the guide — what is being snapped to. */
  label?: string;
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

function openingEdgeAxes(project: InteriorProject, roomId: string): SnapTarget[] {
  const targets: SnapTarget[] = [];
  for (const opening of selectOpeningsForRoom(project, roomId)) {
    const wall = project.walls.find((item) => item.id === opening.wallId);
    if (!wall) continue;
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const length = Math.hypot(dx, dz) || 1;
    const ux = dx / length;
    const uz = dz / length;
    for (const offset of [opening.offsetMm, opening.offsetMm + opening.widthMm]) {
      const point = { x: wall.start.x + ux * offset, z: wall.start.z + uz * offset };
      const label = `${opening.kind} edge`;
      // Prefer axis-aligned opening guides (common case for kitchen walls).
      if (Math.abs(ux) >= Math.abs(uz)) {
        targets.push({ axis: "x", valueMm: point.x, positionMm: point.x, kind: "opening", label });
      } else {
        targets.push({ axis: "z", valueMm: point.z, positionMm: point.z, kind: "opening", label });
      }
    }
  }
  return targets;
}

export function snapLivingRoomObject(
  project: InteriorProject,
  objectId: string,
  desired: Point3Mm,
  gridSizeMm = 50,
  /** When set (e.g. screen-px→world), overrides the fixed-mm grid-derived threshold. */
  thresholdMm?: number,
): PlanSnapResult {
  const object = project.objects.find((item) => item.id === objectId);
  const room = object
    ? project.rooms.find((item) => item.id === object.roomId)
    : null;
  if (!object || !room) return { position: desired, guides: [] };

  const grid = Math.max(10, gridSizeMm);
  const threshold = thresholdMm ?? Math.max(20, grid * 0.6);
  const snapped = {
    ...desired,
    x: Math.round(desired.x / grid) * grid,
    z: Math.round(desired.z / grid) * grid,
  };
  const desiredBounds = getObjectPlanBounds(object, desired);
  const roomBounds = getTopologyRoomPlanBounds(project, room.id);
  const center = roomPlanPolygon(project, room.id);
  const centerPoint = center ? polygonCentroid(center.outer) : { x: 0, z: 0 };
  const xTargets: SnapTarget[] = [
    { axis: "x", valueMm: centerPoint.x, positionMm: centerPoint.x, kind: "center", label: "Room centre" },
    {
      axis: "x",
      valueMm: roomBounds.minX,
      positionMm: desired.x + roomBounds.minX - desiredBounds.minX,
      kind: "wall",
      label: "Wall",
    },
    {
      axis: "x",
      valueMm: roomBounds.maxX,
      positionMm: desired.x + roomBounds.maxX - desiredBounds.maxX,
      kind: "wall",
      label: "Wall",
    },
    {
      axis: "x",
      valueMm: (roomBounds.minX + roomBounds.maxX) / 2,
      positionMm: (roomBounds.minX + roomBounds.maxX) / 2,
      kind: "wall-centre",
      label: "Wall centre",
    },
  ];
  const zTargets: SnapTarget[] = [
    { axis: "z", valueMm: centerPoint.z, positionMm: centerPoint.z, kind: "center", label: "Room centre" },
    {
      axis: "z",
      valueMm: roomBounds.minZ,
      positionMm: desired.z + roomBounds.minZ - desiredBounds.minZ,
      kind: "wall",
      label: "Wall",
    },
    {
      axis: "z",
      valueMm: roomBounds.maxZ,
      positionMm: desired.z + roomBounds.maxZ - desiredBounds.maxZ,
      kind: "wall",
      label: "Wall",
    },
    {
      axis: "z",
      valueMm: (roomBounds.minZ + roomBounds.maxZ) / 2,
      positionMm: (roomBounds.minZ + roomBounds.maxZ) / 2,
      kind: "wall-centre",
      label: "Wall centre",
    },
  ];

  for (const neighbor of project.objects) {
    if (neighbor.id === objectId || neighbor.roomId !== object.roomId) continue;
    const bounds = getObjectPlanBounds(neighbor);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const objectRun = cabinetRunForObject(object)?.runId;
    const neighborRun = cabinetRunForObject(neighbor)?.runId;
    const sameRun = Boolean(objectRun && neighborRun && objectRun === neighborRun);
    const kind: PlanSnapGuide["kind"] = sameRun ? "run" : "object";
    const label = sameRun ? "Run alignment" : "Cabinet";
    for (const valueMm of [bounds.minX, centerX, bounds.maxX]) {
      xTargets.push({
        axis: "x",
        valueMm,
        positionMm: desired.x + valueMm - desiredBounds.minX,
        kind,
        label,
      });
      xTargets.push({
        axis: "x",
        valueMm,
        positionMm: desired.x + valueMm - desiredBounds.maxX,
        kind,
        label,
      });
      xTargets.push({ axis: "x", valueMm, positionMm: valueMm, kind, label });
    }
    for (const valueMm of [bounds.minZ, centerZ, bounds.maxZ]) {
      zTargets.push({
        axis: "z",
        valueMm,
        positionMm: desired.z + valueMm - desiredBounds.minZ,
        kind,
        label,
      });
      zTargets.push({
        axis: "z",
        valueMm,
        positionMm: desired.z + valueMm - desiredBounds.maxZ,
        kind,
        label,
      });
      zTargets.push({ axis: "z", valueMm, positionMm: valueMm, kind, label });
    }
  }

  for (const target of openingEdgeAxes(project, room.id)) {
    if (target.axis === "x") {
      xTargets.push({
        ...target,
        positionMm: desired.x + target.valueMm - desiredBounds.minX,
      });
      xTargets.push({
        ...target,
        positionMm: desired.x + target.valueMm - desiredBounds.maxX,
      });
      xTargets.push(target);
    } else {
      zTargets.push({
        ...target,
        positionMm: desired.z + target.valueMm - desiredBounds.minZ,
      });
      zTargets.push({
        ...target,
        positionMm: desired.z + target.valueMm - desiredBounds.maxZ,
      });
      zTargets.push(target);
    }
  }

  const xTarget = nearestTarget(desired.x, xTargets, threshold);
  const zTarget = nearestTarget(desired.z, zTargets, threshold);
  const guides: PlanSnapGuide[] = [];
  if (xTarget) {
    snapped.x = xTarget.positionMm;
    guides.push({
      axis: "x",
      valueMm: xTarget.valueMm,
      kind: xTarget.kind,
      label: xTarget.label ?? xTarget.kind,
    });
  } else if (snapped.x !== desired.x) {
    guides.push({ axis: "x", valueMm: snapped.x, kind: "grid", label: "Grid" });
  }
  if (zTarget) {
    snapped.z = zTarget.positionMm;
    guides.push({
      axis: "z",
      valueMm: zTarget.valueMm,
      kind: zTarget.kind,
      label: zTarget.label ?? zTarget.kind,
    });
  } else if (snapped.z !== desired.z) {
    guides.push({ axis: "z", valueMm: snapped.z, kind: "grid", label: "Grid" });
  }
  return snapObjectToTopologyWall(project, object, snapped, Math.max(80, threshold * 2))
    ?? { position: snapped, guides };
}

/** Pure helper for tests — pick nearest labelled guide candidate. */
export function pickNearestSnapGuide(
  valueMm: number,
  candidates: readonly PlanSnapGuide[],
  thresholdMm: number,
): PlanSnapGuide | null {
  const targets: SnapTarget[] = candidates.map((guide) => ({
    ...guide,
    positionMm: guide.valueMm,
  }));
  const hit = nearestTarget(valueMm, targets, thresholdMm);
  if (!hit) return null;
  return { axis: hit.axis, valueMm: hit.valueMm, kind: hit.kind, label: hit.label };
}
