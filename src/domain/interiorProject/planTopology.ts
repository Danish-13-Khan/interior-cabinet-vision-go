import type {
  DirectedWallUse,
  EntityId,
  InteriorProject,
  OpeningEntity,
  PlanLoop,
  PlanNodeEntity,
  Point2Mm,
  WallEntity,
} from "./types";

export function pointKey(point: Point2Mm): string {
  return `${point.x}:${point.z}`;
}

export function wallLengthMm(wall: Pick<WallEntity, "start" | "end">): number {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  return Math.hypot(dx, dz);
}

export function wallEndpoints(
  wall: WallEntity,
  nodesById: Map<string, PlanNodeEntity>,
): { start: Point2Mm; end: Point2Mm } | null {
  if (wall.startNodeId && wall.endNodeId) {
    const start = nodesById.get(wall.startNodeId)?.position;
    const end = nodesById.get(wall.endNodeId)?.position;
    if (start && end) return { start, end };
  }
  return { start: wall.start, end: wall.end };
}

export function directedWallEnd(
  wall: WallEntity,
  direction: DirectedWallUse["direction"],
): { fromNodeId?: string; toNodeId?: string } {
  if (!wall.startNodeId || !wall.endNodeId) return {};
  return direction === "forward"
    ? { fromNodeId: wall.startNodeId, toNodeId: wall.endNodeId }
    : { fromNodeId: wall.endNodeId, toNodeId: wall.startNodeId };
}

/** Ordered contiguous wall uses from a set of walls that share endpoints. */
export function buildContiguousWallUses(
  walls: WallEntity[],
): DirectedWallUse[] {
  if (walls.length === 0) return [];
  const remaining = [...walls];
  const uses: DirectedWallUse[] = [];
  let cursor = remaining[0]?.startNodeId;
  if (!cursor) {
    return remaining.map((wall) => ({ wallId: wall.id, direction: "forward" as const }));
  }
  while (remaining.length && cursor) {
    const index = remaining.findIndex(
      (wall) => wall.startNodeId === cursor || wall.endNodeId === cursor,
    );
    if (index < 0) break;
    const [wall] = remaining.splice(index, 1);
    if (!wall) break;
    const forward: boolean = wall.startNodeId === cursor;
    uses.push({ wallId: wall.id, direction: forward ? "forward" : "reverse" });
    cursor = forward ? wall.endNodeId : wall.startNodeId;
  }
  // Any leftover disconnected walls keep forward uses so migration does not drop geometry.
  for (const wall of remaining) {
    uses.push({ wallId: wall.id, direction: "forward" });
  }
  return uses;
}

export function wallIdsForRoomLoops(
  project: Pick<InteriorProject, "rooms" | "loops">,
  roomId: string,
): Set<string> {
  const room = project.rooms.find((item) => item.id === roomId);
  const ids = new Set<string>();
  if (!room) return ids;
  const loopIds = [room.outerLoopId, ...(room.holeLoopIds ?? [])].filter(
    (id): id is string => Boolean(id),
  );
  for (const loopId of loopIds) {
    const loop = project.loops.find((item) => item.id === loopId);
    for (const use of loop?.wallUses ?? []) ids.add(use.wallId);
  }
  return ids;
}

export function selectWallsForRoom(project: InteriorProject, roomId: string): WallEntity[] {
  const fromLoops = wallIdsForRoomLoops(project, roomId);
  return project.walls.filter(
    (wall) => fromLoops.has(wall.id) || wall.roomId === roomId,
  );
}

export function selectOpeningsForRoom(project: InteriorProject, roomId: string): OpeningEntity[] {
  const roomWallIds = new Set(selectWallsForRoom(project, roomId).map((wall) => wall.id));
  return project.openings.filter(
    (opening) => roomWallIds.has(opening.wallId) || opening.roomId === roomId,
  );
}

export function roomIdsUsingWall(
  project: Pick<InteriorProject, "rooms" | "loops">,
  wallId: string,
): EntityId[] {
  const rooms: EntityId[] = [];
  for (const room of project.rooms) {
    const ids = wallIdsForRoomLoops(project, room.id);
    if (ids.has(wallId)) rooms.push(room.id);
  }
  return rooms;
}

export function isLoopContiguous(
  loop: PlanLoop,
  wallsById: Map<string, WallEntity>,
): boolean {
  const uses = loop.wallUses;
  if (uses.length < 3) return false;
  const wallIds = new Set<string>();
  for (const use of uses) {
    if (wallIds.has(use.wallId)) return false;
    wallIds.add(use.wallId);
  }
  for (let index = 0; index < uses.length; index += 1) {
    const current = uses[index]!;
    const next = uses[(index + 1) % uses.length]!;
    const currentWall = wallsById.get(current.wallId);
    const nextWall = wallsById.get(next.wallId);
    if (!currentWall?.startNodeId || !currentWall.endNodeId) return false;
    if (!nextWall?.startNodeId || !nextWall.endNodeId) return false;
    const currentEnd = directedWallEnd(currentWall, current.direction).toNodeId;
    const nextStart = directedWallEnd(nextWall, next.direction).fromNodeId;
    if (!currentEnd || !nextStart || currentEnd !== nextStart) return false;
  }
  return true;
}

/** Shoelace sign in x/z: positive => counter-clockwise, negative => clockwise. */
export function loopSignedArea(
  loop: PlanLoop,
  wallsById: Map<string, WallEntity>,
  nodesById: Map<string, PlanNodeEntity>,
): number {
  const points: Point2Mm[] = [];
  for (const use of loop.wallUses) {
    const wall = wallsById.get(use.wallId);
    if (!wall) continue;
    const fromId = directedWallEnd(wall, use.direction).fromNodeId;
    const node = fromId ? nodesById.get(fromId) : null;
    if (node) points.push(node.position);
  }
  if (points.length < 3) return 0;
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index]!;
    const b = points[(index + 1) % points.length]!;
    area += a.x * b.z - b.x * a.z;
  }
  return area / 2;
}
