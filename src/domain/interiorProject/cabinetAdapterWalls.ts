import { buildContiguousWallUses } from "./planTopology";
import { MANAGED_BY, WALL_SIDES, type AdapterWallSide } from "./cabinetAdapterShared";
import { openingId, wallId } from "./cabinetAdapterIds";
import type {
  InteriorProject,
  InteriorRoomEntity,
  OpeningEntity,
  WallEntity,
} from "./types";
import type { ProjectRoom } from "../projectRooms";

export function wallGeometry(room: ProjectRoom, side: AdapterWallSide): WallEntity {
  const { widthMm, depthMm, heightMm, wallThicknessMm } = room.config.dimensions;
  const halfWidth = widthMm / 2;
  const halfDepth = depthMm / 2;
  const visible =
    side === "back-wall"
      ? room.config.dimensions.showBackWall
      : side === "left-wall"
        ? room.config.dimensions.showLeftWall
        : side === "right-wall"
          ? room.config.dimensions.showRightWall
          : false;
  const endpoints =
    side === "back-wall"
      ? { start: { x: -halfWidth, z: -halfDepth }, end: { x: halfWidth, z: -halfDepth } }
      : side === "front-wall"
        ? { start: { x: halfWidth, z: halfDepth }, end: { x: -halfWidth, z: halfDepth } }
        : side === "left-wall"
          ? { start: { x: -halfWidth, z: halfDepth }, end: { x: -halfWidth, z: -halfDepth } }
          : { start: { x: halfWidth, z: -halfDepth }, end: { x: halfWidth, z: halfDepth } };
  return {
    id: wallId(room.id, side),
    roomId: room.id,
    ...endpoints,
    heightMm,
    thicknessMm: wallThicknessMm,
    visible,
    materialId: null,
    extensions: { managedBy: MANAGED_BY, wallSide: side },
  };
}

export function openingsForRoom(room: ProjectRoom): OpeningEntity[] {
  const doors: OpeningEntity[] = room.config.doors.map((door) => ({
    id: openingId(room.id, "door", door.id),
    roomId: room.id,
    wallId: wallId(room.id, door.side),
    kind: "door",
    offsetMm: door.positionMm,
    widthMm: door.widthMm,
    heightMm: door.heightMm,
    sillHeightMm: 0,
    catalogItemId: "opening:door-single",
    materialSlots: {},
    parameters: {},
    swingDirection: door.swingDirection,
    extensions: { managedBy: MANAGED_BY, sourceId: door.id },
  }));
  const windows: OpeningEntity[] = room.config.windows.map((window) => ({
    id: openingId(room.id, "window", window.id),
    roomId: room.id,
    wallId: wallId(room.id, window.side),
    kind: "window",
    offsetMm: window.positionMm,
    widthMm: window.widthMm,
    heightMm: window.heightMm,
    sillHeightMm: window.sillHeightMm,
    catalogItemId: "opening:window-fixed",
    materialSlots: {},
    parameters: {},
    extensions: { managedBy: MANAGED_BY, sourceId: window.id },
  }));
  return [...doors, ...windows];
}

/** Transitional rectangular adapter projection onto the v2 wall graph. */
export function topologyForRectangularAdapter(walls: WallEntity[], rooms: InteriorRoomEntity[]) {
  const nodeByPoint = new Map<string, string>();
  const nodes: InteriorProject["nodes"] = [];
  const nodeId = (point: WallEntity["start"]) => {
    const key = `${point.x}:${point.z}`;
    const existing = nodeByPoint.get(key);
    if (existing) return existing;
    const id = `adapter-node-${nodeByPoint.size + 1}`;
    nodeByPoint.set(key, id);
    nodes.push({ id, position: { ...point }, extensions: { managedBy: MANAGED_BY } });
    return id;
  };
  const graphWalls = walls.map((wall) => ({ ...wall, startNodeId: nodeId(wall.start), endNodeId: nodeId(wall.end) }));
  const loops = rooms.map((room) => ({
    id: `${room.id}:outer-loop`,
    wallUses: buildContiguousWallUses(graphWalls.filter((wall) => wall.roomId === room.id)),
    extensions: { managedBy: MANAGED_BY },
  }));
  const loopByRoom = new Map(loops.map((loop) => [loop.id.slice(0, -":outer-loop".length), loop.id]));
  return {
    nodes,
    loops,
    walls: graphWalls,
    rooms: rooms.map((room) => ({ ...room, outerLoopId: loopByRoom.get(room.id), holeLoopIds: [] })),
  };
}

/** Prefer catalog/shell walls when a room already has a closed shell; never double-project. */
export function adapterWallsForRooms(rooms: ProjectRoom[], preserved: WallEntity[]) {
  const shared = preserved.filter((wall) => !rooms.some((room) => room.id === wall.roomId));
  const perRoom = rooms.flatMap((room) => {
    const existing = preserved.filter((wall) => wall.roomId === room.id);
    if (existing.length >= 3) return existing;
    return [...existing, ...WALL_SIDES.map((side) => wallGeometry(room, side))];
  });
  return [...shared, ...perRoom];
}
