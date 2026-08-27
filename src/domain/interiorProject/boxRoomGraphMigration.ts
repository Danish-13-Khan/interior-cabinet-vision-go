import { buildContiguousWallUses, pointKey } from "./planTopology";
import type { InteriorProject, PlanLoop, PlanNodeEntity, WallEntity } from "./types";
import { synchronizeWallCaches } from "./wallGraph";

export const WALL_GRAPH_DOMAIN_VERSION = 1;

function segmentKey(wall: WallEntity) {
  const a = pointKey(wall.start);
  const b = pointKey(wall.end);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function compatibleSharedEdge(a: WallEntity, b: WallEntity) {
  return segmentKey(a) === segmentKey(b)
    && a.heightMm === b.heightMm
    && a.thicknessMm === b.thicknessMm;
}

function nextId(prefix: string, used: Set<string>) {
  let index = 1;
  while (used.has(`${prefix}-${index}`)) index += 1;
  const id = `${prefix}-${index}`;
  used.add(id);
  return id;
}

function roomLoop(roomId: string, walls: WallEntity[], loopId: string): PlanLoop {
  const uses = buildContiguousWallUses(walls);
  return { id: loopId, wallUses: uses, extensions: { graphDomainVersion: WALL_GRAPH_DOMAIN_VERSION, roomId } };
}

/** Upgrade rectangular compatibility shells into a canonical, adjacency-capable wall graph. */
export function migrateBoxRoomsToWallGraph(project: InteriorProject): InteriorProject {
  if (project.extensions?.wallGraphDomainVersion === WALL_GRAPH_DOMAIN_VERSION
    && project.walls.every((wall) => wall.startNodeId && wall.endNodeId)
    && project.rooms.every((room) => room.outerLoopId)) {
    return synchronizeWallCaches(project);
  }
  const usedNodeIds = new Set(project.nodes.map((node) => node.id));
  const nodeByPoint = new Map(project.nodes.map((node) => [pointKey(node.position), node.id]));
  const nodes: PlanNodeEntity[] = project.nodes.map((node) => ({ ...node, position: { ...node.position } }));
  const nodeIdFor = (point: { x: number; z: number }) => {
    const key = pointKey(point);
    const existing = nodeByPoint.get(key);
    if (existing) return existing;
    const id = nextId("node", usedNodeIds);
    nodeByPoint.set(key, id); nodes.push({ id, position: { ...point } });
    return id;
  };

  const canonical: WallEntity[] = [];
  const wallIdMap = new Map<string, string>();
  for (const source of project.walls) {
    const wall = { ...source, startNodeId: nodeIdFor(source.start), endNodeId: nodeIdFor(source.end) };
    const shared = canonical.find((candidate) => compatibleSharedEdge(candidate, wall));
    if (shared && source.roomId && shared.roomId !== source.roomId) {
      wallIdMap.set(source.id, shared.id);
      continue;
    }
    wallIdMap.set(source.id, source.id);
    canonical.push(wall);
  }

  const loops: PlanLoop[] = [];
  const rooms = project.rooms.map((room) => {
    const sourceWalls = project.walls.filter((wall) => wall.roomId === room.id);
    const wallIds = [...new Set(sourceWalls.map((wall) => wallIdMap.get(wall.id) ?? wall.id))];
    const roomWalls = wallIds.map((id) => canonical.find((wall) => wall.id === id)).filter((wall): wall is WallEntity => Boolean(wall));
    const loopId = room.outerLoopId ?? `${room.id}:outer-loop`;
    loops.push(roomLoop(room.id, roomWalls, loopId));
    return { ...room, outerLoopId: loopId, holeLoopIds: room.holeLoopIds ?? [] };
  });

  const sharedIds = new Set(canonical.filter((wall) => rooms.filter((room) => {
    const loop = loops.find((item) => item.id === room.outerLoopId);
    return loop?.wallUses.some((use) => use.wallId === wall.id);
  }).length > 1).map((wall) => wall.id));
  const walls = canonical.map((wall) => sharedIds.has(wall.id) ? { ...wall, roomId: null } : wall);
  const openings = project.openings.map((opening) => {
    const { roomId: _legacyRoomId, ...wallHosted } = opening;
    return { ...wallHosted, wallId: wallIdMap.get(opening.wallId) ?? opening.wallId };
  });
  const extensions = { ...project.extensions, wallGraphDomainVersion: WALL_GRAPH_DOMAIN_VERSION };
  return synchronizeWallCaches({ ...project, nodes, walls, loops, rooms, openings, extensions });
}
