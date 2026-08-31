import { centerPolygonAtOrigin } from "./roomPlanBounds";
import { synchronizeWallCaches } from "./wallGraph";
import { synchronizeRoomSurfaceZones } from "./roomSurfaces";
import type { InteriorProject, Point2Mm, WallEntity } from "./types";

function pickMaterialId(project: InteriorProject, match: (id: string, kind: string) => boolean) {
  return project.materials.find((material) => match(material.id, material.kind))?.id ?? null;
}

function wallSideForCenteredEdge(start: Point2Mm, end: Point2Mm) {
  const midX = (start.x + end.x) / 2;
  const midZ = (start.z + end.z) / 2;
  return Math.abs(end.x - start.x) >= Math.abs(end.z - start.z)
    ? (midZ < 0 ? "back" : "front")
    : (midX < 0 ? "left" : "right");
}

export type RoomDrawingKind = "rectangle" | "polygon";
export type RoomDrawingRequest = { kind: RoomDrawingKind; points: Point2Mm[] };

function samePoint(a: Point2Mm, b: Point2Mm) {
  return a.x === b.x && a.z === b.z;
}

function polygonArea(points: Point2Mm[]) {
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length]!;
    return area + point.x * next.z - next.x * point.z;
  }, 0) / 2;
}

export function rectanglePoints(start: Point2Mm, end: Point2Mm): Point2Mm[] {
  const left = Math.min(start.x, end.x);
  const right = Math.max(start.x, end.x);
  const top = Math.min(start.z, end.z);
  const bottom = Math.max(start.z, end.z);
  return [{ x: left, z: top }, { x: right, z: top }, { x: right, z: bottom }, { x: left, z: bottom }];
}

export function normalizeRoomPolygon(points: Point2Mm[]): Point2Mm[] | null {
  const clean = points.filter((point, index) => index === 0 || !samePoint(point, points[index - 1]!));
  if (clean.length > 1 && samePoint(clean[0]!, clean[clean.length - 1]!)) clean.pop();
  if (clean.length < 3 || Math.abs(polygonArea(clean)) < 10_000) return null;
  return polygonArea(clean) < 0 ? [...clean].reverse() : clean;
}

function nextId(prefix: string, existing: Set<string>) {
  let index = 1;
  while (existing.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

/** Adds a D2 room face as an independent closed wall graph; shared-edge operations remain D3. */
export function drawRoomFromPoints(
  project: InteriorProject,
  request: RoomDrawingRequest,
  options?: { raised?: boolean },
): InteriorProject {
  const normalized = normalizeRoomPolygon(request.points);
  if (!normalized) return project;
  const points = centerPolygonAtOrigin(normalized);
  const active = project.rooms.find((room) => room.id === project.activeRoomId) ?? project.rooms[0];
  const roomId = nextId("room", new Set(project.rooms.map((room) => room.id)));
  const loopId = `${roomId}:outer-loop`;
  const nodeByPoint = new Map(project.nodes.map((node) => [`${node.position.x}:${node.position.z}`, node.id]));
  const usedNodeIds = new Set(project.nodes.map((node) => node.id));
  const nodes = [...project.nodes];
  const nodeIdFor = (point: Point2Mm) => {
    const key = `${point.x}:${point.z}`;
    const found = nodeByPoint.get(key);
    if (found) return found;
    const id = nextId("node", usedNodeIds);
    usedNodeIds.add(id); nodeByPoint.set(key, id); nodes.push({ id, position: { ...point } });
    return id;
  };
  const usedWallIds = new Set(project.walls.map((wall) => wall.id));
  const materialId = active
    ? project.walls.find((wall) => wall.roomId === active.id)?.materialId ?? null
    : pickMaterialId(project, (id) => id.includes("wall"));
  const floorMaterialId = active?.extensions?.floorMaterialId
    ?? pickMaterialId(project, (id, kind) => id.includes("stone") || kind === "wood");
  const ceilingMaterialId = active?.extensions?.ceilingMaterialId
    ?? pickMaterialId(project, (id) => id.includes("ceiling"));
  const heightMm = active?.dimensions.heightMm ?? 2800;
  const thicknessMm = active?.wallThicknessMm ?? 120;
  const walls: WallEntity[] = points.map((point, index) => {
    const end = points[(index + 1) % points.length]!;
    const id = nextId("wall", usedWallIds); usedWallIds.add(id);
    return {
      id, roomId, start: { ...point }, end: { ...end }, startNodeId: nodeIdFor(point), endNodeId: nodeIdFor(end),
      heightMm, thicknessMm, raised: options?.raised ?? false, visible: true, materialId,
      extensions: {
        createdBy: "draw-room", drawingKind: request.kind, wallSide: wallSideForCenteredEdge(point, end),
      },
    };
  });
  const xs = points.map((point) => point.x);
  const zs = points.map((point) => point.z);
  const dimensions = { widthMm: Math.max(...xs) - Math.min(...xs), heightMm, depthMm: Math.max(...zs) - Math.min(...zs) };
  const firstRoom = project.rooms.length === 0;
  const room = {
    id: roomId,
    name: firstRoom ? "Room 1" : `Room ${project.rooms.length + 1}`,
    roomType: firstRoom ? "living-room" as const : "custom" as const,
    dimensions, wallThicknessMm: thicknessMm,
    outerLoopId: loopId, holeLoopIds: [],
    extensions: {
      createdBy: "draw-room",
      drawingKind: request.kind,
      ...(typeof floorMaterialId === "string" ? { floorMaterialId } : {}),
      ...(typeof ceilingMaterialId === "string" ? { ceilingMaterialId } : {}),
    },
  };
  return synchronizeRoomSurfaceZones(synchronizeWallCaches({
    ...project, activeRoomId: roomId, nodes, walls: [...project.walls, ...walls], rooms: [...project.rooms, room],
    loops: [...project.loops, { id: loopId, wallUses: walls.map((wall) => ({ wallId: wall.id, direction: "forward" as const })) }],
  }));
}
