import {
  cabinetTypeLabels,
  clampCabinetProject,
  getDefaultCabinetConfig,
  type CabinetConfig,
  type CabinetInstance,
  type CabinetPlacement,
  type CabinetProject,
  type CabinetType,
} from "../cabinetDimensions";
import {
  normalizeMultiRoomProject,
  writeActiveRoomState,
  type ProjectRoom,
} from "../projectRooms";
import type { DoorSide, RoomConfig } from "../roomModel";
import { clampJobMeta, formatJobTitle } from "../jobMeta";
import {
  collectOpeningLeaves,
  setOpeningContentType,
  type OpeningStructure,
} from "../cabinetOpeningStructure";
import { createEmptyInteriorProject } from "./defaults";
import { emptyCabinetProjectFromInterior } from "./emptyCabinetCompat";
import { buildContiguousWallUses, selectOpeningsForRoom, selectWallsForRoom } from "./planTopology";
import {
  INTERIOR_PROJECT_SCHEMA_VERSION,
  type EntityExtensions,
  type InteriorObjectEntity,
  type InteriorProject,
  type InteriorRoomEntity,
  type OpeningEntity,
  type RoomType,
  type WallEntity,
} from "./types";
import { validateInteriorProject } from "./validation";

const CABINET_EXTENSION = "cabinetPlanning";
const MANAGED_BY = "interior-cabinet-adapter";
const WALL_SIDES = ["back-wall", "left-wall", "right-wall", "front-wall"] as const;
type AdapterWallSide = (typeof WALL_SIDES)[number];

type CabinetObjectExtension = {
  sourceId: string;
  config: CabinetConfig;
  layerId?: string;
  groupId?: string | null;
  attachment: CabinetPlacement["attachment"];
};

type CabinetProjectExtension = {
  projectShell: Omit<
    CabinetProject,
    "cabinets" | "rooms" | "activeRoomId" | "interiorDocument"
  >;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function extensionValue<T>(extensions: EntityExtensions | undefined): T | null {
  const value = record(extensions)?.[CABINET_EXTENSION];
  return record(value) ? (value as T) : null;
}

function projectSlug(project: CabinetProject) {
  const job = clampJobMeta(project.job);
  const source = job.projectNumber || job.customerName || "interior-project";
  return source.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "interior-project";
}

function projectName(project: CabinetProject) {
  const job = clampJobMeta(project.job);
  return formatJobTitle(job, "Interior Project");
}

function roomType(room: ProjectRoom): RoomType {
  const saved = record(room.config)?.roomType;
  return typeof saved === "string" && ["living-room", "bedroom", "kitchen", "office", "utility", "custom"].includes(saved)
    ? (saved as RoomType)
    : "custom";
}

function wallId(roomId: string, side: AdapterWallSide) {
  return `${roomId}:wall:${side}`;
}

function openingId(roomId: string, kind: "door" | "window", sourceId: string) {
  return `${roomId}:${kind}:${sourceId}`;
}

function objectId(roomId: string, sourceId: string) {
  return `${roomId}:object:${sourceId}`;
}

function wallGeometry(room: ProjectRoom, side: AdapterWallSide): WallEntity {
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

function openingsForRoom(room: ProjectRoom): OpeningEntity[] {
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
function topologyForRectangularAdapter(walls: WallEntity[], rooms: InteriorRoomEntity[]) {
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
  return { nodes, loops, walls: graphWalls, rooms: rooms.map((room) => ({ ...room, outerLoopId: loopByRoom.get(room.id), holeLoopIds: [] })) };
}

function cabinetObject(roomId: string, cabinet: CabinetInstance): InteriorObjectEntity {
  const extension: CabinetObjectExtension = {
    sourceId: cabinet.id,
    config: cabinet.config,
    layerId: cabinet.layerId,
    groupId: cabinet.groupId,
    attachment: cabinet.placement.attachment,
  };
  return {
    id: objectId(roomId, cabinet.id),
    roomId,
    kind: "cabinet",
    category: cabinet.config.type,
    catalogItemId: `cabinet:${cabinet.config.type}`,
    name: cabinet.name,
    position: {
      x: cabinet.placement.x,
      y: cabinet.placement.y,
      z: cabinet.placement.z,
    },
    rotation: { x: 0, y: cabinet.placement.rotation, z: 0 },
    dimensions: {
      widthMm: cabinet.config.dimensions.width,
      heightMm: cabinet.config.dimensions.height,
      depthMm: cabinet.config.dimensions.depth,
    },
    materialSlots: {},
    parameters: {
      shelfCount: cabinet.config.shelfCount,
      drawerCount: cabinet.config.drawerCount ?? 0,
      hasDoors: cabinet.config.hasDoors,
    },
    extensions: { [CABINET_EXTENSION]: extension },
  };
}

function projectShell(project: CabinetProject): CabinetProjectExtension {
  const {
    cabinets: _cabinets,
    rooms: _rooms,
    activeRoomId: _activeRoomId,
    interiorDocument: _interiorDocument,
    ...shell
  } = project;
  return { projectShell: shell };
}

/** Convert the working cabinet editor state into the canonical project document. */
export function interiorProjectFromCabinetProject(options: {
  project: CabinetProject;
  activeRoom: RoomConfig;
  now?: string;
}): InteriorProject {
  const now = options.now ?? new Date().toISOString();
  const written = writeActiveRoomState(
    options.project,
    options.project.cabinets,
    options.activeRoom,
  );
  const normalized = normalizeMultiRoomProject(written, options.activeRoom);
  const base = normalized.interiorDocument
    ? validateInteriorProject(normalized.interiorDocument).project
    : createEmptyInteriorProject({
        id: projectSlug(normalized),
        name: projectName(normalized),
        now,
      });
  const rooms = normalized.rooms ?? [];
  const roomIds = new Set(rooms.map((room) => room.id));
  const preservedObjects = base.objects.filter(
    (object) => object.kind !== "cabinet" && roomIds.has(object.roomId),
  );
  const preservedWalls = base.walls.filter(
    (wall) => record(wall.extensions)?.managedBy !== MANAGED_BY && (!wall.roomId || roomIds.has(wall.roomId)),
  );
  const preservedOpenings = base.openings.filter(
    (opening) => record(opening.extensions)?.managedBy !== MANAGED_BY && (!opening.roomId || roomIds.has(opening.roomId)),
  );
  const roomEntities: InteriorRoomEntity[] = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    roomType: roomType(room),
    dimensions: {
      widthMm: room.config.dimensions.widthMm,
      heightMm: room.config.dimensions.heightMm,
      depthMm: room.config.dimensions.depthMm,
    },
    wallThicknessMm: room.config.dimensions.wallThicknessMm,
    extensions: { managedBy: MANAGED_BY },
  }));
  const adapterWalls = [...preservedWalls, ...rooms.flatMap((room) => WALL_SIDES.map((side) => wallGeometry(room, side)))];
  const topology = topologyForRectangularAdapter(adapterWalls, roomEntities);
  const document: InteriorProject = {
    ...base,
    schemaVersion: INTERIOR_PROJECT_SCHEMA_VERSION,
    id: base.id || projectSlug(normalized),
    name: projectName(normalized),
    updatedAt: now,
    activeRoomId: normalized.activeRoomId ?? rooms[0]?.id ?? "",
    rooms: topology.rooms,
    nodes: topology.nodes,
    loops: topology.loops,
    walls: topology.walls,
    openings: [...preservedOpenings, ...rooms.flatMap(openingsForRoom)],
    objects: [
      ...preservedObjects,
      ...rooms.flatMap((room) => room.cabinets.map((cabinet) => cabinetObject(room.id, cabinet))),
    ],
    extensions: {
      ...base.extensions,
      [CABINET_EXTENSION]: projectShell(normalized),
    },
  };
  return validateInteriorProject(document).project;
}

function wallSide(wall: WallEntity | undefined): DoorSide | null {
  const side = record(wall?.extensions)?.wallSide;
  return side === "back-wall" || side === "left-wall" || side === "right-wall"
    ? side
    : null;
}

function sourceId(extensions: EntityExtensions | undefined, fallback: string) {
  const value = record(extensions)?.sourceId;
  return typeof value === "string" && value.trim() ? value : fallback;
}

function roomConfigFromDocument(document: InteriorProject, room: InteriorRoomEntity): RoomConfig {
  const roomWalls = selectWallsForRoom(document, room.id);
  const sideVisibility = (side: DoorSide) =>
    roomWalls.find((wall) => wallSide(wall) === side)?.visible ?? true;
  const openings = selectOpeningsForRoom(document, room.id);
  return {
    dimensions: {
      widthMm: room.dimensions.widthMm,
      depthMm: room.dimensions.depthMm,
      heightMm: room.dimensions.heightMm,
      wallThicknessMm: room.wallThicknessMm,
      showBackWall: sideVisibility("back-wall"),
      showLeftWall: sideVisibility("left-wall"),
      showRightWall: sideVisibility("right-wall"),
    },
    doors: openings
      .filter((opening) => opening.kind === "door")
      .flatMap((opening) => {
        const side = wallSide(roomWalls.find((wall) => wall.id === opening.wallId));
        return side
          ? [{
              id: sourceId(opening.extensions, opening.id),
              side,
              positionMm: opening.offsetMm,
              widthMm: opening.widthMm,
              heightMm: opening.heightMm,
              swingDirection: opening.swingDirection ?? "in" as const,
            }]
          : [];
      }),
    windows: openings
      .filter((opening) => opening.kind === "window")
      .flatMap((opening) => {
        const side = wallSide(roomWalls.find((wall) => wall.id === opening.wallId));
        return side
          ? [{
              id: sourceId(opening.extensions, opening.id),
              side,
              positionMm: opening.offsetMm,
              widthMm: opening.widthMm,
              heightMm: opening.heightMm,
              sillHeightMm: opening.sillHeightMm,
            }]
          : [];
      }),
  };
}

function knownCabinetType(value: string): CabinetType {
  return value in cabinetTypeLabels ? (value as CabinetType) : "base";
}

function numericParameter(
  parameters: InteriorObjectEntity["parameters"],
  key: string,
  fallback: number,
) {
  const value = parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function syncDoorStructure(
  structure: OpeningStructure | undefined,
  type: CabinetType,
  widthMm: number,
  hasDoors: boolean,
) {
  if (!structure) return structure;
  const leaves = collectOpeningLeaves(structure.root);
  if (!hasDoors) {
    return leaves
      .filter((leaf) => leaf.contentType === "door")
      .reduce(
        (next, leaf) =>
          setOpeningContentType(next, leaf.id, "open-shelf", type, widthMm),
        structure,
      );
  }
  if (leaves.some((leaf) => leaf.contentType === "door")) return structure;
  return setOpeningContentType(
    structure,
    structure.activeOpeningId,
    "door",
    type,
    widthMm,
  );
}

function cabinetFromObject(object: InteriorObjectEntity): CabinetInstance {
  const extension = extensionValue<CabinetObjectExtension>(object.extensions);
  const type = knownCabinetType(object.category);
  const fallback = getDefaultCabinetConfig(type);
  const payload = extension?.config ?? fallback;
  const shelfCount = numericParameter(
    object.parameters,
    "shelfCount",
    payload.shelfCount,
  );
  const drawerCount = numericParameter(
    object.parameters,
    "drawerCount",
    payload.drawerCount ?? 0,
  );
  const hasDoors =
    typeof object.parameters.hasDoors === "boolean"
      ? object.parameters.hasDoors
      : payload.hasDoors;
  const openingStructure = syncDoorStructure(
    payload.composition?.openingStructure,
    type,
    object.dimensions.widthMm,
    hasDoors,
  );
  // Generic object fields are authoritative; the payload supplies cabinet-only build details.
  const config: CabinetConfig = {
    ...payload,
    type,
    dimensions: {
      ...payload.dimensions,
      width: object.dimensions.widthMm,
      height: object.dimensions.heightMm,
      depth: object.dimensions.depthMm,
    },
    shelfCount,
    drawerCount,
    hasDoors,
    composition: payload.composition
      ? {
          ...payload.composition,
          openingStructure,
          shelves: { ...payload.composition.shelves, count: shelfCount },
          drawers: { ...payload.composition.drawers, count: drawerCount },
          doors: {
            ...payload.composition.doors,
            enabled: hasDoors,
            style: hasDoors
              ? payload.composition.doors.style === "none"
                ? object.dimensions.widthMm < 600
                  ? "single"
                  : "double"
                : payload.composition.doors.style
              : "none",
          },
        }
      : undefined,
  };
  const rotation = Math.round(object.rotation.y / 90) * 90;
  return {
    id: extension?.sourceId || object.id,
    name: object.name,
    config,
    placement: {
      x: object.position.x,
      y: object.position.y,
      z: object.position.z,
      rotation: ((rotation % 360) + 360) % 360 as CabinetPlacement["rotation"],
      attachment: extension?.attachment ?? "floor",
    },
    layerId: extension?.layerId,
    groupId: extension?.groupId,
  };
}

/** Create the compatibility editor model while carrying the canonical document. */
export function cabinetProjectFromInteriorProject(input: unknown): {
  project: CabinetProject;
  room: RoomConfig;
} {
  const document = validateInteriorProject(input).project;
  if (document.rooms.length === 0) {
    const extension = extensionValue<CabinetProjectExtension>(document.extensions);
    return emptyCabinetProjectFromInterior(document, extension?.projectShell ?? {});
  }
  const extension = extensionValue<CabinetProjectExtension>(document.extensions);
  const shell = extension?.projectShell ?? { version: 1, cabinets: [] };
  const rooms: ProjectRoom[] = document.rooms.map((room) => ({
    id: room.id,
    name: room.name,
    config: roomConfigFromDocument(document, room),
    cabinets: document.objects
      .filter((object) => object.roomId === room.id && object.kind === "cabinet")
      .map(cabinetFromObject),
  }));
  const activeRoomId = rooms.some((room) => room.id === document.activeRoomId)
    ? document.activeRoomId
    : rooms[0]!.id;
  const active = rooms.find((room) => room.id === activeRoomId) ?? rooms[0]!;
  const seeded: CabinetProject = {
    ...(shell as CabinetProject),
    version: 1,
    cabinets: active.cabinets,
    rooms,
    activeRoomId,
    interiorDocument: document,
  };
  const project = normalizeMultiRoomProject(clampCabinetProject(seeded), active.config);
  return { project, room: active.config };
}
