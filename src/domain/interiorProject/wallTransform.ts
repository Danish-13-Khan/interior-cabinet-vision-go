import { MIN_SEGMENT_MM } from "./wallEditingHelpers";
import { movePlanNodeWithOpenings, translatePlanWall } from "./wallEditingMove";
import type { InteriorProject, Point2Mm, WallEntity } from "./types";

export type WallPlanPatch = {
  lengthMm?: number;
  angleDeg?: number;
  xMm?: number;
  zMm?: number;
  /** Which endpoint stays fixed when lengthMm is applied. Default: start. */
  lengthAnchor?: "start" | "end";
};

export function wallPlanMidpoint(wall: WallEntity): Point2Mm {
  return { x: (wall.start.x + wall.end.x) / 2, z: (wall.start.z + wall.end.z) / 2 };
}

export function wallPlanAngleDeg(wall: WallEntity): number {
  return Math.round(Math.atan2(wall.end.z - wall.start.z, wall.end.x - wall.start.x) * (180 / Math.PI));
}

/**
 * Stretch a wall along its direction by moving ONE endpoint.
 * Default anchors the start node (keeps start fixed → end moves) — never uniform room scale.
 */
export function setPlanWallLength(
  project: InteriorProject,
  wallId: string,
  lengthMm: number,
  anchor: "start" | "end" = "start",
): InteriorProject {
  const wall = project.walls.find((item) => item.id === wallId);
  if (!wall || !Number.isFinite(lengthMm)) return project;
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.hypot(dx, dz);
  if (length < 1) return project;
  const ux = dx / length;
  const uz = dz / length;
  const nextLength = Math.max(MIN_SEGMENT_MM, Math.min(30000, Math.round(lengthMm)));
  if (anchor === "start") {
    if (!wall.endNodeId) return project;
    return movePlanNodeWithOpenings(
      project,
      wall.endNodeId,
      { x: wall.start.x + ux * nextLength, z: wall.start.z + uz * nextLength },
      { joinCoincident: false },
    );
  }
  if (!wall.startNodeId) return project;
  return movePlanNodeWithOpenings(
    project,
    wall.startNodeId,
    { x: wall.end.x - ux * nextLength, z: wall.end.z - uz * nextLength },
    { joinCoincident: false },
  );
}

/** Rotate a wall around its start node. Adjacent walls stay connected through shared nodes. */
export function setPlanWallAngle(project: InteriorProject, wallId: string, angleDeg: number): InteriorProject {
  const wall = project.walls.find((item) => item.id === wallId);
  if (!wall?.endNodeId || !Number.isFinite(angleDeg)) return project;
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
  if (length < MIN_SEGMENT_MM) return project;
  const radians = (angleDeg * Math.PI) / 180;
  return movePlanNodeWithOpenings(
    project,
    wall.endNodeId,
    { x: wall.start.x + Math.cos(radians) * length, z: wall.start.z + Math.sin(radians) * length },
    { joinCoincident: false },
  );
}

export function applyWallPlanPatch(project: InteriorProject, wallId: string, patch: WallPlanPatch): InteriorProject {
  let next = project;
  if (patch.lengthMm != null) next = setPlanWallLength(next, wallId, patch.lengthMm, patch.lengthAnchor ?? "start");
  if (patch.angleDeg != null) next = setPlanWallAngle(next, wallId, patch.angleDeg);
  if (patch.xMm == null && patch.zMm == null) return next;
  const wall = next.walls.find((item) => item.id === wallId);
  if (!wall) return next;
  const mid = wallPlanMidpoint(wall);
  return translatePlanWall(next, wallId, {
    x: (patch.xMm ?? mid.x) - mid.x,
    z: (patch.zMm ?? mid.z) - mid.z,
  }, { joinCoincident: false });
}
