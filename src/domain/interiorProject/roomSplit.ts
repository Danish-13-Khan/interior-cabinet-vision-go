import { pointInPolygon, polygonSignedArea, roomPlanPolygon } from "./roomGeometry";
import { roomIdsUsingWall } from "./planTopology";
import { synchronizeRoomSurfaceZones } from "./roomSurfaces";
import { synchronizeWallCaches } from "./wallGraph";
import { MIN_SEGMENT_MM, nextId } from "./wallEditingHelpers";
import { splitPlanWallResult } from "./wallEditingSplitDelete";
import type { DirectedWallUse, InteriorProject, Point2Mm, WallEntity } from "./types";

const EPSILON_MM = 0.5;

type BoundaryHit = { wallId: string; offsetMm: number; nodeId?: string };

function distance(a: Point2Mm, b: Point2Mm) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function boundaryHit(project: InteriorProject, roomId: string, point: Point2Mm): BoundaryHit | null {
  const room = project.rooms.find((item) => item.id === roomId);
  const loop = project.loops.find((item) => item.id === room?.outerLoopId);
  if (!loop) return null;
  for (const use of loop.wallUses) {
    const wall = project.walls.find((item) => item.id === use.wallId);
    if (!wall?.startNodeId || !wall.endNodeId) continue;
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const length = Math.hypot(dx, dz);
    if (length < EPSILON_MM) continue;
    const offsetMm = ((point.x - wall.start.x) * dx + (point.z - wall.start.z) * dz) / length;
    const cross = Math.abs((point.z - wall.start.z) * dx - (point.x - wall.start.x) * dz) / length;
    if (cross > EPSILON_MM || offsetMm < -EPSILON_MM || offsetMm > length + EPSILON_MM) continue;
    if (offsetMm <= EPSILON_MM) return { wallId: wall.id, offsetMm: 0, nodeId: wall.startNodeId };
    if (offsetMm >= length - EPSILON_MM) return { wallId: wall.id, offsetMm: length, nodeId: wall.endNodeId };
    return { wallId: wall.id, offsetMm };
  }
  return null;
}

function nodeAtPoint(project: InteriorProject, point: Point2Mm) {
  return project.nodes.find((node) => distance(node.position, point) <= EPSILON_MM)?.id ?? null;
}

function splitBoundaryAt(project: InteriorProject, hit: BoundaryHit): InteriorProject {
  if (hit.nodeId) return project;
  return splitPlanWallResult(project, hit.wallId, hit.offsetMm).project;
}

function wallUseStartsAt(wall: WallEntity, use: DirectedWallUse, nodeId: string) {
  return use.direction === "forward" ? wall.startNodeId === nodeId : wall.endNodeId === nodeId;
}

function usesBetween(uses: DirectedWallUse[], from: number, to: number) {
  const result: DirectedWallUse[] = [];
  for (let index = from; index !== to; index = (index + 1) % uses.length) result.push(uses[index]!);
  return result;
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

function remapFaceMembership(
  project: InteriorProject,
  sourceRoomId: string,
  nextRoomId: string,
  nextPolygon: Point2Mm[],
): InteriorProject {
  if (nextPolygon.length < 3) return project;
  const inside = (point: Point2Mm) => pointInPolygon(point, nextPolygon);
  return {
    ...project,
    objects: project.objects.map((item) =>
      item.roomId === sourceRoomId && inside({ x: item.position.x, z: item.position.z })
        ? { ...item, roomId: nextRoomId } : item),
    lights: project.lights.map((item) =>
      item.roomId === sourceRoomId && inside({ x: item.position.x, z: item.position.z })
        ? { ...item, roomId: nextRoomId } : item),
    cameras: project.cameras.map((item) =>
      item.roomId === sourceRoomId && inside({ x: item.position.x, z: item.position.z })
        ? { ...item, roomId: nextRoomId } : item),
  };
}

/**
 * Splits a closed room face when a drawn segment joins two different boundary edges.
 * Returns null when the segment is not a valid face bisector, allowing normal wall drawing.
 */
export function splitRoomByWall(
  project: InteriorProject,
  roomId: string,
  start: Point2Mm,
  end: Point2Mm,
): InteriorProject | null {
  const room = project.rooms.find((item) => item.id === roomId);
  const polygon = roomPlanPolygon(project, roomId);
  if (!room?.outerLoopId || !polygon || room.holeLoopIds?.length || distance(start, end) < MIN_SEGMENT_MM) {
    return null;
  }
  const startHit = boundaryHit(project, roomId, start);
  const endHit = boundaryHit(project, roomId, end);
  if (!startHit || !endHit || startHit.wallId === endHit.wallId) return null;

  const midpoint = { x: (start.x + end.x) / 2, z: (start.z + end.z) / 2 };
  if (!pointInPolygon(midpoint, polygon.outer)) return null;

  let working = splitBoundaryAt(project, startHit);
  const refreshedEndHit = boundaryHit(working, roomId, end);
  if (!refreshedEndHit) return null;
  working = splitBoundaryAt(working, refreshedEndHit);
  const startNodeId = nodeAtPoint(working, start);
  const endNodeId = nodeAtPoint(working, end);
  const loop = working.loops.find((item) => item.id === room.outerLoopId);
  if (!startNodeId || !endNodeId || !loop || startNodeId === endNodeId) return null;

  const wallsById = new Map(working.walls.map((wall) => [wall.id, wall]));
  const startIndex = loop.wallUses.findIndex((use) => {
    const wall = wallsById.get(use.wallId); return Boolean(wall && wallUseStartsAt(wall, use, startNodeId));
  });
  const endIndex = loop.wallUses.findIndex((use) => {
    const wall = wallsById.get(use.wallId); return Boolean(wall && wallUseStartsAt(wall, use, endNodeId));
  });
  if (startIndex < 0 || endIndex < 0 || startIndex === endIndex) return null;

  const wallId = nextId("wall", new Set(working.walls.map((wall) => wall.id)));
  const nextRoomId = nextId("room", new Set(working.rooms.map((item) => item.id)));
  const nextLoopId = `${nextRoomId}:outer-loop`;
  const splitWall: WallEntity = {
    id: wallId, roomId: null, start: { ...start }, end: { ...end }, startNodeId, endNodeId,
    heightMm: room.dimensions.heightMm, thicknessMm: room.wallThicknessMm, visible: true,
    materialId: working.walls.find((wall) => wall.roomId === roomId)?.materialId ?? null,
    extensions: { createdBy: "draw-wall", structuralKind: "room-split" },
  };
  const firstUses = [...usesBetween(loop.wallUses, startIndex, endIndex), { wallId, direction: "reverse" as const }];
  const secondUses = [...usesBetween(loop.wallUses, endIndex, startIndex), { wallId, direction: "forward" as const }];
  const nextRoom = {
    ...room, id: nextRoomId, name: `Room ${working.rooms.length + 1}`, outerLoopId: nextLoopId,
    holeLoopIds: [], extensions: { ...room.extensions, createdBy: "room-split", splitFromRoomId: room.id },
  };
  let next: InteriorProject = {
    ...working,
    walls: [...working.walls, splitWall],
    rooms: [...working.rooms, nextRoom],
    loops: working.loops.map((item) => item.id === loop.id ? { ...item, wallUses: firstUses } : item)
      .concat({ id: nextLoopId, wallUses: secondUses }),
  };
  const secondPolygon = roomPlanPolygon(next, nextRoomId)?.outer ?? [];
  next = remapFaceMembership(next, roomId, nextRoomId, secondPolygon);
  // Keep positive shoelace (interior on left / CCW in x-z) to match topology validation.
  const updatedLoops = next.loops.map((item) => {
    if (item.id !== loop.id && item.id !== nextLoopId) return item;
    const points = item.wallUses.map((use) => {
      const wall = next.walls.find((candidate) => candidate.id === use.wallId)!;
      return use.direction === "forward" ? wall.start : wall.end;
    });
    return polygonSignedArea(points) >= 0 ? item : {
      ...item,
      wallUses: [...item.wallUses].reverse().map((use): DirectedWallUse => ({
        ...use, direction: use.direction === "forward" ? "reverse" : "forward",
      })),
    };
  });
  return synchronizeRoomSurfaceZones(synchronizeWallCaches(syncLegacyRoomHints({ ...next, loops: updatedLoops })));
}
