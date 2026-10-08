import type { InteriorProject, PlanNodeEntity, Point2Mm, WallEntity } from "./types";
import { createWallGraphIndex } from "./wallGraph";
import { MIN_SEGMENT_MM } from "./wallEditingHelpers";
import { joinPlanNodes } from "./wallEditingJoinNodes";
import { splitPlanWallResult } from "./wallEditingSplitDelete";

/**
 * Commit-time joins (roadmap S4). The snap engine already put the point on a
 * node or on a wall's line, so one millimetre absorbs floating-point drift;
 * callers can widen it when they commit unsnapped points.
 */
export const WALL_JOIN_TOLERANCE_MM = 1;

function distance(a: Point2Mm, b: Point2Mm) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function nearestPlanNode(
  project: InteriorProject,
  point: Point2Mm,
  toleranceMm: number,
  excludeNodeIds: readonly string[] = [],
): PlanNodeEntity | null {
  const excluded = new Set(excludeNodeIds);
  let best: PlanNodeEntity | null = null;
  let bestDistance = toleranceMm;
  for (const node of project.nodes) {
    if (excluded.has(node.id)) continue;
    const d = distance(node.position, point);
    if (d <= bestDistance) {
      best = node;
      bestDistance = d;
    }
  }
  return best;
}

export type WallSpanHit = { wall: WallEntity; offsetMm: number };

/**
 * The wall whose span passes within `toleranceMm` of the point, with the point
 * far enough from both ends to leave two legal segments after a split.
 */
export function wallSpanHit(
  project: InteriorProject,
  point: Point2Mm,
  toleranceMm: number,
  excludeWallIds: readonly string[] = [],
): WallSpanHit | null {
  const excluded = new Set(excludeWallIds);
  let best: WallSpanHit | null = null;
  let bestDistance = toleranceMm;
  for (const wall of project.walls) {
    if (excluded.has(wall.id) || !wall.startNodeId || !wall.endNodeId) continue;
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const length = Math.hypot(dx, dz);
    if (length < MIN_SEGMENT_MM * 2) continue;
    const offsetMm = ((point.x - wall.start.x) * dx + (point.z - wall.start.z) * dz) / length;
    if (offsetMm < MIN_SEGMENT_MM || offsetMm > length - MIN_SEGMENT_MM) continue;
    const perpendicular = Math.abs((point.z - wall.start.z) * dx - (point.x - wall.start.x) * dz) / length;
    if (perpendicular > bestDistance) continue;
    bestDistance = perpendicular;
    best = { wall, offsetMm };
  }
  return best;
}

function newNodeAfterSplit(before: InteriorProject, after: InteriorProject, near: Point2Mm): PlanNodeEntity | null {
  const known = new Set(before.nodes.map((node) => node.id));
  return after.nodes.find((node) => !known.has(node.id))
    ?? nearestPlanNode(after, near, MIN_SEGMENT_MM);
}

export type ResolvedWallEndpoint = { project: InteriorProject; point: Point2Mm; nodeId: string | null };

/**
 * Where a drawn endpoint lands: on an existing node within tolerance, or on a
 * wall's span, which is split there (a T-junction) so the new wall meets a
 * real node. Otherwise the point is returned unchanged.
 */
export function resolveWallEndpoint(
  project: InteriorProject,
  point: Point2Mm,
  toleranceMm = WALL_JOIN_TOLERANCE_MM,
): ResolvedWallEndpoint {
  const node = nearestPlanNode(project, point, toleranceMm);
  if (node) return { project, point: { ...node.position }, nodeId: node.id };
  const hit = wallSpanHit(project, point, toleranceMm);
  if (!hit) return { project, point, nodeId: null };
  const split = splitPlanWallResult(project, hit.wall.id, hit.offsetMm).project;
  const created = newNodeAfterSplit(project, split, point);
  if (!created) return { project, point, nodeId: null };
  return { project: split, point: { ...created.position }, nodeId: created.id };
}

/**
 * After a node moved: merge it into a node it now sits on (that node wins), or
 * split the wall whose span it now sits on and merge the split node into the
 * moved one, which keeps its snapped position. Walls already attached to the
 * node are never split.
 */
export function weldNodeIntoWalls(
  project: InteriorProject,
  nodeId: string,
  toleranceMm = WALL_JOIN_TOLERANCE_MM,
): InteriorProject {
  const node = project.nodes.find((item) => item.id === nodeId);
  if (!node) return project;
  const other = nearestPlanNode(project, node.position, toleranceMm, [nodeId]);
  // The existing node keeps its exact coordinates; the dragged node folds into it.
  if (other) return joinPlanNodes(project, other.id, nodeId);
  const incident = createWallGraphIndex(project).incidentWallIdsByNode.get(nodeId) ?? [];
  const hit = wallSpanHit(project, node.position, toleranceMm, incident);
  if (!hit) return project;
  const split = splitPlanWallResult(project, hit.wall.id, hit.offsetMm).project;
  const created = newNodeAfterSplit(project, split, node.position);
  if (!created || created.id === nodeId) return split;
  return joinPlanNodes(split, nodeId, created.id);
}
