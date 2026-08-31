import { PLAN_TRACE_HEIGHT_MM, clampWallHeightMm } from "./authoringStandards";
import { wallIdsForRoomLoops } from "./planTopology";
import type { InteriorProject, InteriorRoomEntity, WallEntity } from "./types";

/** Missing `raised` means already extruded — saved templates and older files stay 3D. */
export function isWallRaised(wall: Pick<WallEntity, "raised">) {
  return wall.raised !== false;
}

export function compileWallHeightMm(wall: Pick<WallEntity, "raised" | "heightMm">) {
  return isWallRaised(wall) ? wall.heightMm : PLAN_TRACE_HEIGHT_MM;
}

export function outerLoopWallsRaised(project: InteriorProject, room: InteriorRoomEntity) {
  const loop = project.loops.find((item) => item.id === room.outerLoopId);
  const walls = (loop?.wallUses ?? [])
    .map((use) => project.walls.find((wall) => wall.id === use.wallId))
    .filter((wall): wall is WallEntity => Boolean(wall));
  return walls.length > 0 && walls.every(isWallRaised);
}

export function setPlanWallsRaised(
  project: InteriorProject,
  wallIds: readonly string[],
  raised: boolean,
  heightMm?: number,
): InteriorProject {
  const ids = new Set(wallIds);
  if (ids.size === 0) return project;
  const height = heightMm === undefined ? undefined : clampWallHeightMm(heightMm);
  const walls = project.walls.map((wall) => {
    if (!ids.has(wall.id)) return wall;
    return {
      ...wall,
      raised,
      ...(height !== undefined ? { heightMm: height } : {}),
    };
  });
  const rooms = project.rooms.map((room) => {
    const roomWallIds = wallIdsForRoomLoops(project, room.id);
    if (![...ids].some((id) => roomWallIds.has(id))) return room;
    const raisedHeights = walls
      .filter((wall) => roomWallIds.has(wall.id) && isWallRaised(wall))
      .map((wall) => wall.heightMm);
    if (raisedHeights.length === 0) return room;
    return {
      ...room,
      dimensions: { ...room.dimensions, heightMm: Math.max(...raisedHeights) },
    };
  });
  return { ...project, walls, rooms };
}
