import { pointKey } from "./planTopology";
import { createWallGraphIndex } from "./wallGraph";
import type { InteriorProject, PlanLoop, PlanNodeEntity, Point2Mm, WallEntity } from "./types";

export type WallSegmentRequest = {
  start: Point2Mm;
  end: Point2Mm;
  roomId?: string;
  kind?: "wall" | "partition";
};

export const MIN_SEGMENT_MM = 150;

export function nextId(prefix: string, used: Set<string>) {
  let index = 1;
  while (used.has(`${prefix}-${index}`)) index += 1;
  const id = `${prefix}-${index}`;
  used.add(id);
  return id;
}

export function segmentKey(a: Point2Mm, b: Point2Mm) {
  const ka = pointKey(a);
  const kb = pointKey(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}

export function wallSegmentKey(wall: Pick<WallEntity, "start" | "end">) {
  return segmentKey(wall.start, wall.end);
}

export function compatibleSharedEdge(a: WallEntity, b: WallEntity) {
  return wallSegmentKey(a) === wallSegmentKey(b)
    && a.heightMm === b.heightMm
    && a.thicknessMm === b.thicknessMm;
}

export function cloneNodes(project: InteriorProject) {
  const nodes = project.nodes.map((node) => ({ ...node, position: { ...node.position } }));
  const nodeByPoint = new Map(nodes.map((node) => [pointKey(node.position), node.id]));
  const usedNodeIds = new Set(nodes.map((node) => node.id));
  return { nodes, nodeByPoint, usedNodeIds };
}

export function ensureNode(
  point: Point2Mm,
  nodes: PlanNodeEntity[],
  nodeByPoint: Map<string, string>,
  usedNodeIds: Set<string>,
) {
  const key = pointKey(point);
  const existing = nodeByPoint.get(key);
  if (existing) return existing;
  const id = nextId("node", usedNodeIds);
  nodeByPoint.set(key, id);
  nodes.push({ id, position: { ...point } });
  return id;
}

export function replaceWallUse(
  loop: PlanLoop,
  fromWallId: string,
  replacements: Array<{ wallId: string; direction: PlanLoop["wallUses"][number]["direction"] }>,
): PlanLoop {
  const nextUses: PlanLoop["wallUses"] = [];
  for (const use of loop.wallUses) {
    if (use.wallId !== fromWallId) {
      nextUses.push(use);
      continue;
    }
    for (const replacement of replacements) nextUses.push(replacement);
  }
  return { ...loop, wallUses: nextUses };
}

export function pruneOrphanNodes(project: InteriorProject): InteriorProject {
  const index = createWallGraphIndex(project);
  const nodes = project.nodes.filter((node) => (index.incidentWallIdsByNode.get(node.id)?.length ?? 0) > 0);
  return { ...project, nodes };
}
