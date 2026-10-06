import { wallIdsForRoomLoops } from "./planTopology";
import { pickMaterialId } from "./roomDrawing";
import { synchronizeRoomSurfaceZones } from "./roomSurfaces";
import type { DirectedWallUse, InteriorProject, InteriorRoomEntity, Point2Mm, WallEntity } from "./types";
import { nextId } from "./wallEditingHelpers";
import { synchronizeWallCaches } from "./wallGraph";

/** One directed traversal of a wall inside a candidate room loop. */
type LoopStep = { wall: WallEntity; fromNodeId: string };

const MIN_ROOM_AREA_MM2 = 10_000;

function otherEnd(wall: WallEntity, nodeId: string): string {
  return wall.startNodeId === nodeId ? wall.endNodeId! : wall.startNodeId!;
}

/** Wall ids already owned by any room boundary (outer or hole loop). */
function loopOwnedWallIds(project: InteriorProject): Set<string> {
  const ids = new Set<string>();
  for (const room of project.rooms) {
    for (const id of wallIdsForRoomLoops(project, room.id)) ids.add(id);
  }
  return ids;
}

/** Shortest path over `walls` from `from` to `to` that never uses `skipWallId`. */
function findWallPath(
  walls: WallEntity[],
  from: string,
  to: string,
  skipWallId: string,
): LoopStep[] | null {
  const adjacency = new Map<string, WallEntity[]>();
  for (const wall of walls) {
    if (wall.id === skipWallId || !wall.startNodeId || !wall.endNodeId) continue;
    for (const nodeId of [wall.startNodeId, wall.endNodeId]) {
      const list = adjacency.get(nodeId) ?? [];
      list.push(wall);
      adjacency.set(nodeId, list);
    }
  }
  const parent = new Map<string, LoopStep>();
  const queue = [from];
  const seen = new Set([from]);
  while (queue.length) {
    const nodeId = queue.shift()!;
    if (nodeId === to) break;
    for (const wall of adjacency.get(nodeId) ?? []) {
      const next = otherEnd(wall, nodeId);
      if (seen.has(next)) continue;
      seen.add(next);
      parent.set(next, { wall, fromNodeId: nodeId });
      queue.push(next);
    }
  }
  if (!seen.has(to)) return null;
  const path: LoopStep[] = [];
  let cursor = to;
  while (cursor !== from) {
    const step = parent.get(cursor);
    if (!step) return null;
    path.unshift(step);
    cursor = step.fromNodeId;
  }
  return path;
}

function shoelace(points: Point2Mm[]): number {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index]!;
    const b = points[(index + 1) % points.length]!;
    area += a.x * b.z - b.x * a.z;
  }
  return area / 2;
}

/** Reverse the traversal so the interior ends up on the left (positive shoelace area). */
function reverseSteps(steps: LoopStep[]): LoopStep[] {
  return [...steps].reverse().map((step) => ({ wall: step.wall, fromNodeId: otherEnd(step.wall, step.fromNodeId) }));
}

/**
 * Tracing walls on an empty site (for example over an imported plan) builds a free wall graph
 * that no room owns. When `wallId` closes a cycle in that graph, promote the cycle to a room so
 * the trace becomes a real room with an outer loop, floor and ceiling.
 * Returns null when the wall leaves the free graph open.
 */
export function formRoomFromClosedFreeWalls(project: InteriorProject, wallId: string): InteriorProject | null {
  const wall = project.walls.find((item) => item.id === wallId);
  if (!wall?.startNodeId || !wall.endNodeId || wall.startNodeId === wall.endNodeId) return null;
  if (wall.extensions?.isPartition) return null;
  const owned = loopOwnedWallIds(project);
  if (owned.has(wall.id)) return null;
  const free = project.walls.filter((item) => !owned.has(item.id) && !item.extensions?.isPartition);
  const path = findWallPath(free, wall.endNodeId, wall.startNodeId, wall.id);
  if (!path || path.length < 2) return null;

  const nodesById = new Map(project.nodes.map((node) => [node.id, node]));
  let steps: LoopStep[] = [{ wall, fromNodeId: wall.startNodeId }, ...path];
  const corner = (step: LoopStep) => nodesById.get(step.fromNodeId)?.position;
  if (steps.some((step) => !corner(step))) return null;
  const area = shoelace(steps.map((step) => corner(step)!));
  if (Math.abs(area) < MIN_ROOM_AREA_MM2) return null;
  if (area < 0) steps = reverseSteps(steps);
  const points = steps.map((step) => corner(step)!);

  const roomId = nextId("room", new Set(project.rooms.map((room) => room.id)));
  const loopId = `${roomId}:outer-loop`;
  const firstRoom = project.rooms.length === 0;
  const xs = points.map((point) => point.x);
  const zs = points.map((point) => point.z);
  const heightMm = Math.max(...steps.map((step) => step.wall.heightMm));
  const floorMaterialId = pickMaterialId(project, (id, kind) => id.includes("stone") || kind === "wood");
  const ceilingMaterialId = pickMaterialId(project, (id) => id.includes("ceiling"));
  const room: InteriorRoomEntity = {
    id: roomId,
    name: firstRoom ? "Room 1" : `Room ${project.rooms.length + 1}`,
    roomType: firstRoom ? "living-room" : "custom",
    dimensions: { widthMm: Math.max(...xs) - Math.min(...xs), heightMm, depthMm: Math.max(...zs) - Math.min(...zs) },
    wallThicknessMm: wall.thicknessMm,
    outerLoopId: loopId,
    holeLoopIds: [],
    extensions: {
      createdBy: "draw-wall",
      ...(typeof floorMaterialId === "string" ? { floorMaterialId } : {}),
      ...(typeof ceilingMaterialId === "string" ? { ceilingMaterialId } : {}),
    },
  };
  const wallUses: DirectedWallUse[] = steps.map((step) => ({
    wallId: step.wall.id,
    direction: step.wall.startNodeId === step.fromNodeId ? "forward" : "reverse",
  }));
  const cycleIds = new Set(steps.map((step) => step.wall.id));
  return synchronizeRoomSurfaceZones(synchronizeWallCaches({
    ...project,
    activeRoomId: roomId,
    rooms: [...project.rooms, room],
    walls: project.walls.map((item) => (cycleIds.has(item.id) ? { ...item, roomId } : item)),
    loops: [...project.loops, { id: loopId, wallUses }],
  }));
}
