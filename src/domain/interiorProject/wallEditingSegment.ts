import { DEFAULT_WALL_HEIGHT_MM, DEFAULT_WALL_THICKNESS_MM } from "./authoringStandards";
import { formRoomFromClosedFreeWalls } from "./freeWallRoom";
import { pickMaterialId } from "./roomDrawing";
import { splitRoomByWall } from "./roomSplit";
import type { InteriorProject, PlanNodeEntity, Point2Mm, WallEntity } from "./types";
import { attachSharedWallToRoom } from "./wallEditingSharedEdge";
import { synchronizeWallCaches } from "./wallGraph";
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

/**
 * Commit-time fallback for domain callers that pass `snapSizeMm` without the
 * plan snap engine: the nearest node within half a grid step, else the grid.
 * Interactive tools use `planSnapEngine` instead.
 */
export function snapPlanPoint(
  point: Point2Mm,
  snapSizeMm: number,
  nodes: PlanNodeEntity[],
): Point2Mm {
  let best: PlanNodeEntity | null = null;
  let bestDistance = snapSizeMm / 2;
  for (const node of nodes) {
    const distance = Math.hypot(node.position.x - point.x, node.position.z - point.z);
    if (distance <= bestDistance) {
      best = node;
      bestDistance = distance;
    }
  }
  if (best) return { ...best.position };
  return {
    x: Math.round(point.x / snapSizeMm) * snapSizeMm,
    z: Math.round(point.z / snapSizeMm) * snapSizeMm,
  };
}

function defaultWallMaterialId(project: InteriorProject, roomId: string | null): string | null {
  if (roomId) {
    return project.walls.find((wall) => wall.roomId === roomId)?.materialId
      ?? project.walls[0]?.materialId
      ?? null;
  }
  return project.walls[0]?.materialId ?? pickMaterialId(project, (id) => id.includes("wall"));
}

/**
 * Draw a snapped wall segment; reuses compatible shared edges instead of duplicating geometry.
 * Without an active room (an empty site or an imported plan) the wall is a free trace; once
 * free walls close into a loop they become the room.
 */
export function createWallSegment(project: InteriorProject, request: WallSegmentRequest): InteriorProject {
  const roomId = request.roomId ?? project.activeRoomId;
  const room = project.rooms.find((item) => item.id === roomId) ?? null;
  if (Math.hypot(request.end.x - request.start.x, request.end.z - request.start.z) < MIN_SEGMENT_MM) {
    return project;
  }

  if (room && request.kind !== "partition") {
    const split = splitRoomByWall(project, roomId, request.start, request.end);
    if (split) return split;
  }

  const { nodes, nodeByPoint, usedNodeIds } = cloneNodes(project);
  const startNodeId = ensureNode(request.start, nodes, nodeByPoint, usedNodeIds);
  const endNodeId = ensureNode(request.end, nodes, nodeByPoint, usedNodeIds);
  if (startNodeId === endNodeId) return project;

  const partition = request.kind === "partition";
  const candidate: WallEntity = {
    id: "candidate",
    roomId: room ? roomId : null,
    start: { ...request.start },
    end: { ...request.end },
    startNodeId,
    endNodeId,
    heightMm: request.heightMm ?? room?.dimensions.heightMm ?? DEFAULT_WALL_HEIGHT_MM,
    thicknessMm: request.thicknessMm ?? room?.wallThicknessMm ?? DEFAULT_WALL_THICKNESS_MM,
    raised: request.raised ?? false,
    visible: true,
    materialId: request.materialId !== undefined
      ? request.materialId
      : defaultWallMaterialId(project, room ? roomId : null),
    extensions: partition
      ? { createdBy: "draw-partition", isPartition: true, structuralKind: "partition" }
      : { createdBy: "draw-wall" },
  };

  const sharedWall = partition ? null
    : project.walls.find((wall) => compatibleSharedEdge(wall, candidate));
  if (sharedWall) {
    // A free trace over an existing segment adds nothing.
    if (!room) return project;
    const synced = synchronizeWallCaches({ ...project, nodes });
    return attachSharedWallToRoom(synced, sharedWall, roomId, { start: request.start, end: request.end });
  }

  const wallId = nextId("wall", new Set(project.walls.map((wall) => wall.id)));
  const next = synchronizeWallCaches({
    ...project,
    nodes,
    walls: [...project.walls, { ...candidate, id: wallId }],
  });
  if (room || partition) return next;
  return formRoomFromClosedFreeWalls(next, wallId) ?? next;
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
