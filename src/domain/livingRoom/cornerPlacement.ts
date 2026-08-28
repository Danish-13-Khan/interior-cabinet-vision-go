import type { InteriorObjectEntity, InteriorProject, Point2Mm, WallEntity } from "../interiorProject";
import { orientWallForRoom, selectWallsForRoom } from "../interiorProject";
import { wallLength } from "./wallSegmentPlacement";

export type RoomWallCorner = {
  nodeId: string;
  position: Point2Mm;
  wallIds: [string, string];
  angleDeg: number;
  rotationY: number;
  bisector: { x: number; z: number };
};

function wallDirectionFromNode(
  project: InteriorProject,
  roomId: string,
  wall: WallEntity,
  nodeId: string,
): { x: number; z: number } | null {
  const oriented = orientWallForRoom(project, roomId, wall);
  const length = wallLength(oriented);
  if (!length) return null;
  const ux = (oriented.end.x - oriented.start.x) / length;
  const uz = (oriented.end.z - oriented.start.z) / length;
  if (oriented.startNodeId === nodeId) return { x: ux, z: uz };
  if (oriented.endNodeId === nodeId) return { x: -ux, z: -uz };
  return null;
}

export function listRoomWallCorners(project: InteriorProject, roomId: string): RoomWallCorner[] {
  const walls = selectWallsForRoom(project, roomId);
  const nodesById = new Map(project.nodes.map((node) => [node.id, node]));
  const incidents = new Map<string, WallEntity[]>();

  for (const wall of walls) {
    for (const nodeId of [wall.startNodeId, wall.endNodeId]) {
      if (!nodeId) continue;
      const list = incidents.get(nodeId) ?? [];
      list.push(wall);
      incidents.set(nodeId, list);
    }
  }

  const corners: RoomWallCorner[] = [];
  for (const [nodeId, incidentWalls] of incidents) {
    if (incidentWalls.length !== 2) continue;
    const [wallA, wallB] = incidentWalls as [WallEntity, WallEntity];
    const node = nodesById.get(nodeId);
    if (!node) continue;

    const dirA = wallDirectionFromNode(project, roomId, wallA, nodeId);
    const dirB = wallDirectionFromNode(project, roomId, wallB, nodeId);
    if (!dirA || !dirB) continue;

    const dot = dirA.x * dirB.x + dirA.z * dirB.z;
    const angleDeg = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
    if (angleDeg < 35 || angleDeg > 175) continue;

    const bx = dirA.x + dirB.x;
    const bz = dirA.z + dirB.z;
    const scale = Math.hypot(bx, bz) || 1;
    const bisector = { x: bx / scale, z: bz / scale };
    corners.push({
      nodeId,
      position: { ...node.position },
      wallIds: [wallA.id, wallB.id],
      angleDeg,
      rotationY: Math.round((Math.atan2(bisector.x, bisector.z) * 180) / Math.PI) || 0,
      bisector,
    });
  }
  return corners;
}

export function preferredRoomWallCorner(project: InteriorProject, roomId: string): RoomWallCorner | null {
  const corners = listRoomWallCorners(project, roomId);
  if (corners.length === 0) return null;
  return [...corners].sort((a, b) => Math.abs(a.angleDeg - 90) - Math.abs(b.angleDeg - 90))[0] ?? null;
}

export function placeCornerCabinet(
  project: InteriorProject,
  object: InteriorObjectEntity,
  corner: RoomWallCorner,
): InteriorObjectEntity {
  const walls = corner.wallIds
    .map((wallId) => project.walls.find((wall) => wall.id === wallId))
    .filter((wall): wall is WallEntity => Boolean(wall));
  const thickness = walls.reduce((sum, wall) => sum + wall.thicknessMm, 0) / Math.max(1, walls.length);
  const offset = thickness / 2 + object.dimensions.depthMm / 2;
  return {
    ...object,
    position: {
      x: corner.position.x + corner.bisector.x * offset,
      y: 0,
      z: corner.position.z + corner.bisector.z * offset,
    },
    rotation: { x: 0, y: corner.rotationY, z: 0 },
    extensions: {
      ...object.extensions,
      wallAttachment: { wallId: corner.wallIds[0] },
      cornerPlacement: { nodeId: corner.nodeId, wallIds: corner.wallIds },
    },
  };
}

/** Re-seat corner cabinets when either of their stored junction walls changes. */
export function reflowCornerCabinetsForWalls(project: InteriorProject, wallIds: readonly string[]) {
  const changed = new Set(wallIds);
  const replacements = new Map<string, InteriorObjectEntity>();
  for (const object of project.objects) {
    const placement = object.extensions?.cornerPlacement;
    if (!placement || typeof placement !== "object") continue;
    const source = placement as Record<string, unknown>;
    const nodeId = typeof source.nodeId === "string" ? source.nodeId : null;
    const storedWallIds = Array.isArray(source.wallIds) ? source.wallIds.filter((id): id is string => typeof id === "string") : [];
    if (!nodeId || !storedWallIds.some((wallId) => changed.has(wallId))) continue;
    const corner = listRoomWallCorners(project, object.roomId).find((item) => item.nodeId === nodeId);
    if (corner) replacements.set(object.id, placeCornerCabinet(project, object, corner));
  }
  return replacements.size ? { ...project, objects: project.objects.map((object) => replacements.get(object.id) ?? object) } : project;
}
