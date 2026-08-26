import { synchronizeWallCaches } from "./wallGraph";
import type { InteriorProject, PlanNodeEntity, Point2Mm, WallEntity } from "./types";
import { attachSharedWallToRoom } from "./wallEditingSharedEdge";
import {
  MIN_SEGMENT_MM,
  cloneNodes,
  compatibleSharedEdge,
  ensureNode,
  nextId,
  segmentKey,
  type WallSegmentRequest,
  wallSegmentKey,
} from "./wallEditingHelpers";

export function snapPlanPoint(
  point: Point2Mm,
  snapSizeMm: number,
  nodes: PlanNodeEntity[],
): Point2Mm {
  const snapped = {
    x: Math.round(point.x / snapSizeMm) * snapSizeMm,
    z: Math.round(point.z / snapSizeMm) * snapSizeMm,
  };
  for (const node of nodes) {
    if (Math.hypot(node.position.x - snapped.x, node.position.z - snapped.z) <= snapSizeMm / 2) {
      return { ...node.position };
    }
  }
  return snapped;
}

/** Draw a snapped wall segment; reuses compatible shared edges instead of duplicating geometry. */
export function createWallSegment(project: InteriorProject, request: WallSegmentRequest): InteriorProject {
  const roomId = request.roomId ?? project.activeRoomId;
  const room = project.rooms.find((item) => item.id === roomId);
  if (!room) return project;
  if (Math.hypot(request.end.x - request.start.x, request.end.z - request.start.z) < MIN_SEGMENT_MM) {
    return project;
  }

  const { nodes, nodeByPoint, usedNodeIds } = cloneNodes(project);
  const startNodeId = ensureNode(request.start, nodes, nodeByPoint, usedNodeIds);
  const endNodeId = ensureNode(request.end, nodes, nodeByPoint, usedNodeIds);
  if (startNodeId === endNodeId) return project;

  const candidate: WallEntity = {
    id: "candidate",
    roomId,
    start: { ...request.start },
    end: { ...request.end },
    startNodeId,
    endNodeId,
    heightMm: room.dimensions.heightMm,
    thicknessMm: room.wallThicknessMm,
    visible: true,
    materialId: project.walls.find((wall) => wall.roomId === roomId)?.materialId
      ?? project.walls[0]?.materialId
      ?? null,
    extensions: { createdBy: "draw-wall" },
  };

  const sharedWall = project.walls.find((wall) => compatibleSharedEdge(wall, candidate));
  if (sharedWall) {
    const synced = synchronizeWallCaches({ ...project, nodes });
    return attachSharedWallToRoom(synced, sharedWall, roomId, { start: request.start, end: request.end });
  }

  const wallId = nextId("wall", new Set(project.walls.map((wall) => wall.id)));
  return synchronizeWallCaches({
    ...project,
    nodes,
    walls: [...project.walls, { ...candidate, id: wallId }],
  });
}

export function createWallSegmentResult(project: InteriorProject, request: WallSegmentRequest) {
  const beforeIds = new Set(project.walls.map((wall) => wall.id));
  const segmentLookup = segmentKey(request.start, request.end);
  const next = createWallSegment(project, request);
  const wallId = next.walls.find((wall) => !beforeIds.has(wall.id))?.id
    ?? next.walls.find((wall) => wallSegmentKey(wall) === segmentLookup)?.id
    ?? null;
  return { project: next, wallId };
}
