import { directedWallEnd, roomIdsUsingWall } from "./planTopology";
import { synchronizeWallCaches } from "./wallGraph";
import { synchronizeRoomSurfaceZones } from "./roomSurfaces";
import type { DirectedWallUse, InteriorProject, PlanLoop, Point2Mm, WallEntity } from "./types";
import { segmentKey, wallSegmentKey } from "./wallEditingHelpers";

function insertWallUseIntoLoop(
  loop: PlanLoop,
  wall: WallEntity,
  newUse: DirectedWallUse,
  walls: WallEntity[],
): PlanLoop {
  const wallsById = new Map(walls.map((item) => [item.id, item]));
  const fromNodeId = directedWallEnd(wall, newUse.direction).fromNodeId;
  const toNodeId = directedWallEnd(wall, newUse.direction).toNodeId;
  if (!fromNodeId || !toNodeId) {
    return { ...loop, wallUses: [...loop.wallUses, newUse] };
  }

  for (let index = 0; index < loop.wallUses.length; index += 1) {
    const use = loop.wallUses[index]!;
    const segment = wallsById.get(use.wallId);
    if (!segment) continue;
    if (directedWallEnd(segment, use.direction).toNodeId === fromNodeId) {
      const wallUses = [...loop.wallUses];
      wallUses.splice(index + 1, 0, newUse);
      return { ...loop, wallUses };
    }
  }

  for (let index = 0; index < loop.wallUses.length; index += 1) {
    const use = loop.wallUses[index]!;
    const segment = wallsById.get(use.wallId);
    if (!segment) continue;
    if (directedWallEnd(segment, use.direction).fromNodeId === toNodeId) {
      const wallUses = [...loop.wallUses];
      wallUses.splice(index, 0, newUse);
      return { ...loop, wallUses };
    }
  }

  return { ...loop, wallUses: [...loop.wallUses, newUse] };
}

function resolveSharedDirection(
  project: InteriorProject,
  sharedWall: WallEntity,
  roomId: string,
  draw?: { start: Point2Mm; end: Point2Mm },
): DirectedWallUse["direction"] {
  const targetLoopId = project.rooms.find((room) => room.id === roomId)?.outerLoopId;
  const other = project.loops
    .filter((loop) => loop.id !== targetLoopId)
    .flatMap((loop) => loop.wallUses)
    .find((use) => use.wallId === sharedWall.id);
  if (other) return other.direction === "forward" ? "reverse" : "forward";
  if (draw) {
    const drawKey = segmentKey(draw.start, draw.end);
    return drawKey === wallSegmentKey(sharedWall) ? "forward" : "reverse";
  }
  return "forward";
}

function markSharedWallRoomId(project: InteriorProject, wallId: string): WallEntity[] {
  const rooms = roomIdsUsingWall(project, wallId);
  return project.walls.map((wall) => {
    if (wall.id !== wallId) return wall;
    if (rooms.length >= 2) return { ...wall, roomId: null };
    if (rooms.length === 1) return { ...wall, roomId: rooms[0]! };
    return wall;
  });
}

/** Attach an existing shared wall to a room loop with the opposite traversal when already shared. */
export function attachSharedWallToRoom(
  project: InteriorProject,
  sharedWall: WallEntity,
  roomId: string,
  draw?: { start: Point2Mm; end: Point2Mm },
): InteriorProject {
  const room = project.rooms.find((item) => item.id === roomId);
  if (!room?.outerLoopId) return project;

  const loopIndex = project.loops.findIndex((loop) => loop.id === room.outerLoopId);
  if (loopIndex < 0) return project;

  const loop = project.loops[loopIndex]!;
  const direction = resolveSharedDirection(project, sharedWall, roomId, draw);
  const loops = [...project.loops];
  if (loop.wallUses.some((use) => use.wallId === sharedWall.id)) {
    loops[loopIndex] = loop;
  } else {
    loops[loopIndex] = insertWallUseIntoLoop(
      loop,
      sharedWall,
      { wallId: sharedWall.id, direction },
      project.walls,
    );
  }

  const withLoops = { ...project, loops };
  const walls = markSharedWallRoomId(withLoops, sharedWall.id);
  return synchronizeRoomSurfaceZones(synchronizeWallCaches({ ...withLoops, walls }));
}
