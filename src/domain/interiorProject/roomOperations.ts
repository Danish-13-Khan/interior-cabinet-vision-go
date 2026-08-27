import { buildContiguousWallUses, isLoopContiguous, loopSignedArea, roomIdsUsingWall } from "./planTopology";
import { pointInPolygon, roomPlanPolygon, roomPolygonIsValid } from "./roomGeometry";
import { synchronizeRoomSurfaceZones } from "./roomSurfaces";
import { isGeneratedRoomSurface } from "./surfaceEditing";
import { synchronizeWallCaches } from "./wallGraph";
import type { DirectedWallUse, InteriorProject, Point2Mm, SurfaceZoneEntity } from "./types";

function activeFallback(rooms: InteriorProject["rooms"], removedId: string, activeRoomId: string) {
  return activeRoomId === removedId ? rooms[0]?.id ?? "" : activeRoomId;
}

function syncLegacyRoomHints(project: InteriorProject): InteriorProject {
  return {
    ...project,
    walls: project.walls.map((wall) => {
      const roomIds = roomIdsUsingWall(project, wall.id);
      return { ...wall, roomId: roomIds.length === 1 ? roomIds[0]! : null };
    }),
  };
}

function remainingRoomForWall(project: InteriorProject, rooms: InteriorProject["rooms"], wallId: string) {
  return rooms.find((room) => {
    const loopIds = [room.outerLoopId, ...(room.holeLoopIds ?? [])];
    return project.loops.some((loop) => loopIds.includes(loop.id) && loop.wallUses.some((use) => use.wallId === wallId));
  })?.id ?? null;
}

function surfaceSample(surface: SurfaceZoneEntity): Point2Mm | null {
  return surface.polygon?.[0] ?? null;
}

/** Remove a room face and only its unshared topology and room-owned content. */
export function deleteInteriorRoom(project: InteriorProject, roomId: string): InteriorProject {
  if (project.rooms.length <= 1 || !project.rooms.some((room) => room.id === roomId)) return project;
  const removed = project.rooms.find((room) => room.id === roomId)!;
  const removedLoopIds = new Set([removed.outerLoopId, ...(removed.holeLoopIds ?? [])].filter(Boolean));
  const retainedRooms = project.rooms.filter((room) => room.id !== roomId);
  const usedByRemaining = new Set(retainedRooms.flatMap((room) => {
    const loopIds = [room.outerLoopId, ...(room.holeLoopIds ?? [])].filter(Boolean);
    return project.loops.filter((loop) => loopIds.includes(loop.id))
      .flatMap((loop) => loop.wallUses.map((use) => use.wallId));
  }));
  const removedWallIds = new Set(project.loops.filter((loop) => removedLoopIds.has(loop.id))
    .flatMap((loop) => loop.wallUses.map((use) => use.wallId))
    .filter((wallId) => !usedByRemaining.has(wallId)));
  const walls = project.walls.filter((wall) => !removedWallIds.has(wall.id));
  const usedNodeIds = new Set(walls.flatMap((wall) => [wall.startNodeId, wall.endNodeId].filter(Boolean)));
  const next: InteriorProject = {
    ...project,
    activeRoomId: activeFallback(retainedRooms, roomId, project.activeRoomId),
    rooms: retainedRooms,
    loops: project.loops.filter((loop) => !removedLoopIds.has(loop.id)),
    walls,
    nodes: project.nodes.filter((node) => usedNodeIds.has(node.id)),
    openings: project.openings
      .filter((opening) => !removedWallIds.has(opening.wallId))
      .map((opening) => opening.roomId === roomId ? {
        ...opening, roomId: remainingRoomForWall(project, retainedRooms, opening.wallId),
      } : opening),
    surfaces: project.surfaces.filter((surface) => surface.roomId !== roomId),
    objects: project.objects.filter((object) => object.roomId !== roomId),
    lights: project.lights.filter((light) => light.roomId !== roomId),
    cameras: project.cameras.filter((camera) => camera.roomId !== roomId),
  };
  return synchronizeRoomSurfaceZones(synchronizeWallCaches(syncLegacyRoomHints(next)));
}

function reverseUses(uses: DirectedWallUse[]): DirectedWallUse[] {
  return [...uses].reverse().map((use) => ({
    ...use, direction: use.direction === "forward" ? "reverse" : "forward",
  }));
}

/**
 * Merge two adjacent, hole-free rooms by removing their shared boundary. The target room
 * keeps its identity/name; content from the absorbed room moves into it.
 */
export function mergeInteriorRooms(
  project: InteriorProject,
  targetRoomId: string,
  absorbedRoomId: string,
): InteriorProject {
  if (targetRoomId === absorbedRoomId) return project;
  const target = project.rooms.find((room) => room.id === targetRoomId);
  const absorbed = project.rooms.find((room) => room.id === absorbedRoomId);
  if (!target?.outerLoopId || !absorbed?.outerLoopId || target.holeLoopIds?.length || absorbed.holeLoopIds?.length) {
    return project;
  }
  const targetLoop = project.loops.find((loop) => loop.id === target.outerLoopId);
  const absorbedLoop = project.loops.find((loop) => loop.id === absorbed.outerLoopId);
  if (!targetLoop || !absorbedLoop) return project;
  const targetWallIds = new Set(targetLoop.wallUses.map((use) => use.wallId));
  const sharedWallIds = new Set(
    absorbedLoop.wallUses.map((use) => use.wallId).filter((wallId) => targetWallIds.has(wallId)),
  );
  if (sharedWallIds.size === 0) return project;

  const mergedWallIds = new Set([...targetWallIds, ...absorbedLoop.wallUses.map((use) => use.wallId)]);
  for (const sharedWallId of sharedWallIds) mergedWallIds.delete(sharedWallId);
  const boundaryWalls = project.walls.filter((wall) => mergedWallIds.has(wall.id));
  let mergedUses = buildContiguousWallUses(boundaryWalls);
  const wallMap = new Map(project.walls.map((wall) => [wall.id, wall]));
  if (mergedUses.length < 3 || !isLoopContiguous({ ...targetLoop, wallUses: mergedUses }, wallMap)) {
    return project;
  }
  const nodeMap = new Map(project.nodes.map((node) => [node.id, node]));
  if (loopSignedArea({ ...targetLoop, wallUses: mergedUses }, wallMap, nodeMap) < 0) {
    mergedUses = reverseUses(mergedUses);
  }

  const loops = project.loops
    .filter((loop) => loop.id !== absorbed.outerLoopId)
    .map((loop) => loop.id === target.outerLoopId ? { ...loop, wallUses: mergedUses } : loop);
  const rooms = project.rooms.filter((room) => room.id !== absorbedRoomId);
  const topology: InteriorProject = {
    ...project,
    activeRoomId: project.activeRoomId === absorbedRoomId ? targetRoomId : project.activeRoomId,
    rooms,
    loops,
    walls: project.walls.filter((wall) => !sharedWallIds.has(wall.id)),
    openings: project.openings.filter((opening) => !sharedWallIds.has(opening.wallId)).map((opening) =>
      opening.roomId === absorbedRoomId ? { ...opening, roomId: targetRoomId } : opening),
    objects: project.objects.map((object) =>
      object.roomId === absorbedRoomId ? { ...object, roomId: targetRoomId } : object),
    lights: project.lights.map((light) =>
      light.roomId === absorbedRoomId ? { ...light, roomId: targetRoomId } : light),
    cameras: project.cameras.map((camera) =>
      camera.roomId === absorbedRoomId ? { ...camera, roomId: targetRoomId } : camera),
  };
  const polygon = roomPlanPolygon(topology, targetRoomId);
  if (!polygon || !roomPolygonIsValid(polygon)) return project;
  const surfaces = project.surfaces.flatMap((surface) => {
    if (surface.roomId !== absorbedRoomId) return [surface];
    if (isGeneratedRoomSurface(surface)) return [];
    const sample = surfaceSample(surface);
    if (sample && !pointInPolygon(sample, polygon.outer)) return [];
    return [{
      ...surface,
      roomId: targetRoomId,
      loopId: surface.loopId === absorbed.outerLoopId ? null : surface.loopId,
    }];
  });
  const usedNodeIds = new Set(
    topology.walls.flatMap((wall) => [wall.startNodeId, wall.endNodeId].filter(Boolean)),
  );
  return synchronizeRoomSurfaceZones(synchronizeWallCaches(syncLegacyRoomHints({
    ...topology,
    surfaces,
    nodes: topology.nodes.filter((node) => usedNodeIds.has(node.id)),
  })));
}
