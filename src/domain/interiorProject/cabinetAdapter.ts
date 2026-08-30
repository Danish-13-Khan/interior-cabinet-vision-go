import {
  clampCabinetProject,
  type CabinetProject,
} from "../cabinetDimensions";
import {
  diagnoseInteriorCabinets,
  readCabinetIdentity,
  type AdapterDiagnostic,
} from "../cabinetIdentity";
import {
  normalizeMultiRoomProject,
  writeActiveRoomState,
  type ProjectRoom,
} from "../projectRooms";
import type { RoomConfig } from "../roomModel";
import { createEmptyInteriorProject } from "./defaults";
import { CABINET_EXTENSION, MANAGED_BY, record } from "./cabinetAdapterShared";
import { objectId, projectName, projectSlug } from "./cabinetAdapterIds";
import { adapterWallsForRooms, openingsForRoom, topologyForRectangularAdapter } from "./cabinetAdapterWalls";
import { roomConfigFromDocument, roomEntitiesFromProject } from "./cabinetAdapterRooms";
import { cabinetFromObject, cabinetObject } from "./cabinetAdapterCabinets";
import {
  INTERIOR_PROJECT_SCHEMA_VERSION,
  type InteriorProject,
} from "./types";
import { validateInteriorProject } from "./validation";

type CabinetProjectExtension = {
  projectShell: Omit<
    CabinetProject,
    "cabinets" | "rooms" | "activeRoomId" | "interiorDocument"
  >;
};

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
  const written = writeActiveRoomState(options.project, options.project.cabinets, options.activeRoom);
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
  const writtenCabinetIds = new Set(
    rooms.flatMap((room) =>
      room.cabinets.map((cabinet) => cabinet.interiorObjectId || objectId(room.id, cabinet.id)),
    ),
  );
  const preservedObjects = base.objects.filter((object) => {
    if (!roomIds.has(object.roomId)) return false;
    if (object.kind !== "cabinet") return true;
    if (writtenCabinetIds.has(object.id)) return false;
    return readCabinetIdentity(object) == null;
  });
  const preservedWalls = base.walls.filter(
    (wall) => record(wall.extensions)?.managedBy !== MANAGED_BY && (!wall.roomId || roomIds.has(wall.roomId)),
  );
  const preservedOpenings = base.openings.filter(
    (opening) => record(opening.extensions)?.managedBy !== MANAGED_BY && (!opening.roomId || roomIds.has(opening.roomId)),
  );
  const roomEntities = roomEntitiesFromProject(rooms);
  const topology = topologyForRectangularAdapter(
    adapterWallsForRooms(rooms, preservedWalls),
    roomEntities,
  );
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

function extensionShell(document: InteriorProject): CabinetProjectExtension | null {
  const value = record(document.extensions)?.[CABINET_EXTENSION];
  return record(value) ? (value as CabinetProjectExtension) : null;
}

/** Create the compatibility editor model while carrying the canonical document. */
export function cabinetProjectFromInteriorProject(input: unknown): {
  project: CabinetProject;
  room: RoomConfig;
  diagnostics: AdapterDiagnostic[];
} {
  const document = validateInteriorProject(input).project;
  if (document.rooms.length === 0) {
    throw new Error("Interior project does not contain a room.");
  }
  const extension = extensionShell(document);
  const shell = extension?.projectShell ?? { version: 1, cabinets: [] };
  const rooms: ProjectRoom[] = document.rooms.map((room) => ({
    id: room.id,
    name: room.name,
    config: roomConfigFromDocument(document, room),
    cabinets: document.objects
      .filter((object) => object.roomId === room.id && object.kind === "cabinet")
      .flatMap((object) => {
        const cabinet = cabinetFromObject(object);
        return cabinet ? [cabinet] : [];
      }),
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
  return {
    project,
    room: active.config,
    diagnostics: diagnoseInteriorCabinets(document).diagnostics,
  };
}
