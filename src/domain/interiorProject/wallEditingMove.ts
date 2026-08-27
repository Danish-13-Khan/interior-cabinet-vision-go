import { mergeCoincidentPlanNodes } from "./wallEditingJoin";
import { MIN_SEGMENT_MM } from "./wallEditingHelpers";
import { snapPlanPoint } from "./wallEditingSegment";
import { roomIdsUsingWall } from "./planTopology";
import { roomPlanPolygon, roomPolygonIsValid } from "./roomGeometry";
import { createWallGraphIndex, movePlanNode, synchronizeWallCaches } from "./wallGraph";
import { synchronizeRoomSurfaceZones } from "./roomSurfaces";
import type { InteriorProject, Point2Mm } from "./types";

function lengthOf(start: Point2Mm, end: Point2Mm) {
  return Math.hypot(end.x - start.x, end.z - start.z);
}

function wallLengthMap(project: InteriorProject) {
  return new Map(project.walls.map((wall) => [
    wall.id,
    lengthOf(wall.start, wall.end),
  ]));
}

/** Keep hosted openings inside their walls after graph length changes. */
export function clampOpeningsToWallLengths(
  project: InteriorProject,
  oldLengths: Map<string, number>,
): InteriorProject {
  const openings = project.openings.map((opening) => {
    const oldLength = oldLengths.get(opening.wallId);
    const wall = project.walls.find((item) => item.id === opening.wallId);
    if (!wall || oldLength === undefined || oldLength < 1) return opening;
    const newLength = lengthOf(wall.start, wall.end);
    if (newLength < 1) return opening;
    const ratio = newLength / oldLength;
    const widthMm = Math.min(newLength, opening.widthMm * ratio);
    return {
      ...opening,
      widthMm,
      offsetMm: Math.max(0, Math.min(newLength - widthMm, opening.offsetMm * ratio)),
    };
  });
  return { ...project, openings };
}

function nodeMoveCollapsesEdge(
  project: InteriorProject,
  nodeId: string,
  position: Point2Mm,
): boolean {
  const index = createWallGraphIndex(project);
  for (const wallId of index.incidentWallIdsByNode.get(nodeId) ?? []) {
    const wall = index.wallsById.get(wallId);
    if (!wall?.startNodeId || !wall.endNodeId) continue;
    const start = wall.startNodeId === nodeId
      ? position
      : index.nodesById.get(wall.startNodeId)?.position;
    const end = wall.endNodeId === nodeId
      ? position
      : index.nodesById.get(wall.endNodeId)?.position;
    if (!start || !end || lengthOf(start, end) < MIN_SEGMENT_MM) return true;
  }
  return false;
}

function affectedRoomIdsForNodes(project: InteriorProject, nodeIds: string[]): Set<string> {
  const index = createWallGraphIndex(project);
  const roomIds = new Set<string>();
  for (const nodeId of nodeIds) {
    for (const wallId of index.incidentWallIdsByNode.get(nodeId) ?? []) {
      for (const roomId of roomIdsUsingWall(project, wallId)) roomIds.add(roomId);
    }
  }
  return roomIds;
}

/** True when every affected room still has a simple, non-degenerate plan polygon. */
export function affectedRoomsRemainValid(
  project: InteriorProject,
  nodeIds: string[],
): boolean {
  for (const roomId of affectedRoomIdsForNodes(project, nodeIds)) {
    const polygon = roomPlanPolygon(project, roomId);
    if (!polygon || !roomPolygonIsValid(polygon)) return false;
  }
  return true;
}

/** Move a graph node, clamp openings, and optionally join coincident endpoints. */
export function movePlanNodeWithOpenings(
  project: InteriorProject,
  nodeId: string,
  position: Point2Mm,
  options?: { snapSizeMm?: number; joinCoincident?: boolean },
): InteriorProject {
  if (!project.nodes.some((node) => node.id === nodeId)) return project;
  const others = project.nodes.filter((node) => node.id !== nodeId);
  const target = options?.snapSizeMm !== undefined
    ? snapPlanPoint(position, options.snapSizeMm, others)
    : position;
  if (nodeMoveCollapsesEdge(project, nodeId, target)) return project;
  const oldLengths = wallLengthMap(project);
  let next = clampOpeningsToWallLengths(movePlanNode(project, nodeId, target), oldLengths);
  if (options?.joinCoincident !== false) next = mergeCoincidentPlanNodes(next);
  if (!affectedRoomsRemainValid(next, [nodeId])) return project;
  return next;
}

/** Translate a wall by moving both endpoint nodes the same delta. */
export function translatePlanWall(
  project: InteriorProject,
  wallId: string,
  delta: Point2Mm,
  options?: { snapSizeMm?: number; joinCoincident?: boolean },
): InteriorProject {
  const wall = project.walls.find((item) => item.id === wallId);
  if (!wall?.startNodeId || !wall.endNodeId) return project;
  if (Math.hypot(delta.x, delta.z) < 0.01) return project;
  const startNode = project.nodes.find((node) => node.id === wall.startNodeId);
  const endNode = project.nodes.find((node) => node.id === wall.endNodeId);
  if (!startNode || !endNode) return project;

  const snap = options?.snapSizeMm;
  const movedStart = snap !== undefined
    ? snapPlanPoint(
      { x: startNode.position.x + delta.x, z: startNode.position.z + delta.z },
      snap,
      project.nodes.filter((node) => node.id !== startNode.id && node.id !== endNode.id),
    )
    : { x: startNode.position.x + delta.x, z: startNode.position.z + delta.z };
  const applied = { x: movedStart.x - startNode.position.x, z: movedStart.z - startNode.position.z };
  const movedEnd = { x: endNode.position.x + applied.x, z: endNode.position.z + applied.z };

  if (nodeMoveCollapsesEdge(project, startNode.id, movedStart)) return project;
  const afterStart = {
    ...project,
    nodes: project.nodes.map((node) => node.id === startNode.id
      ? { ...node, position: movedStart }
      : node),
  };
  if (nodeMoveCollapsesEdge(afterStart, endNode.id, movedEnd)) return project;

  const oldLengths = wallLengthMap(project);
  const moved = synchronizeRoomSurfaceZones(synchronizeWallCaches({
    ...project,
    nodes: project.nodes.map((node) => {
      if (node.id === startNode.id) return { ...node, position: movedStart };
      if (node.id === endNode.id) return { ...node, position: movedEnd };
      return node;
    }),
  }));
  let next = clampOpeningsToWallLengths(moved, oldLengths);
  if (options?.joinCoincident !== false) next = mergeCoincidentPlanNodes(next);
  if (!affectedRoomsRemainValid(next, [startNode.id, endNode.id])) return project;
  return next;
}
