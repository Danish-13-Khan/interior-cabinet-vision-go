import type { InteriorProject, PlanLoop, PlanNodeEntity, Point2Mm, WallEntity } from "./types";

export type WallGraphIndex = {
  nodesById: Map<string, PlanNodeEntity>;
  wallsById: Map<string, WallEntity>;
  loopsById: Map<string, PlanLoop>;
  incidentWallIdsByNode: Map<string, string[]>;
};

export function createWallGraphIndex(project: Pick<InteriorProject, "nodes" | "walls" | "loops">): WallGraphIndex {
  const nodesById = new Map(project.nodes.map((node) => [node.id, node]));
  const wallsById = new Map(project.walls.map((wall) => [wall.id, wall]));
  const loopsById = new Map(project.loops.map((loop) => [loop.id, loop]));
  const incidentWallIdsByNode = new Map<string, string[]>();
  for (const wall of project.walls) {
    for (const nodeId of [wall.startNodeId, wall.endNodeId]) {
      if (!nodeId) continue;
      incidentWallIdsByNode.set(nodeId, [...(incidentWallIdsByNode.get(nodeId) ?? []), wall.id]);
    }
  }
  return { nodesById, wallsById, loopsById, incidentWallIdsByNode };
}

export function graphWallPoints(wall: WallEntity, nodesById: Map<string, PlanNodeEntity>) {
  const start = wall.startNodeId ? nodesById.get(wall.startNodeId)?.position : undefined;
  const end = wall.endNodeId ? nodesById.get(wall.endNodeId)?.position : undefined;
  return start && end ? { start, end } : null;
}

export function synchronizeWallCaches(project: InteriorProject): InteriorProject {
  const index = createWallGraphIndex(project);
  return {
    ...project,
    walls: project.walls.map((wall) => {
      const points = graphWallPoints(wall, index.nodesById);
      return points ? { ...wall, start: { ...points.start }, end: { ...points.end } } : wall;
    }),
  };
}

export function movePlanNode(project: InteriorProject, nodeId: string, position: Point2Mm): InteriorProject {
  if (!project.nodes.some((node) => node.id === nodeId)) return project;
  return synchronizeWallCaches({
    ...project,
    nodes: project.nodes.map((node) => node.id === nodeId ? { ...node, position: { ...position } } : node),
  });
}

export function wallDegree(index: WallGraphIndex, nodeId: string) {
  return index.incidentWallIdsByNode.get(nodeId)?.length ?? 0;
}
