import { MIN_SEGMENT_MM } from "./wallEditingHelpers";
import { createWallSegment } from "./wallEditingSegment";
import type { InteriorProject } from "./types";

const MIN_OFFSET_MM = 50;
const MAX_OFFSET_MM = 4000;

/** Create a parallel partition offset from a wall. Positive distance goes left of start→end. */
export function offsetPlanWall(
  project: InteriorProject,
  wallId: string,
  offsetMm: number,
): InteriorProject {
  const wall = project.walls.find((item) => item.id === wallId);
  if (!wall || !Number.isFinite(offsetMm) || offsetMm === 0) return project;
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.hypot(dx, dz);
  if (length < MIN_SEGMENT_MM) return project;
  const distance = Math.max(MIN_OFFSET_MM, Math.min(MAX_OFFSET_MM, Math.round(Math.abs(offsetMm))));
  const sign = offsetMm < 0 ? -1 : 1;
  const nx = (-dz / length) * sign;
  const nz = (dx / length) * sign;
  return createWallSegment(project, {
    start: { x: wall.start.x + nx * distance, z: wall.start.z + nz * distance },
    end: { x: wall.end.x + nx * distance, z: wall.end.z + nz * distance },
    roomId: wall.roomId ?? project.activeRoomId,
    kind: "partition",
    heightMm: wall.heightMm,
    thicknessMm: wall.thicknessMm,
    materialId: wall.materialId,
    raised: wall.raised !== false,
  });
}
