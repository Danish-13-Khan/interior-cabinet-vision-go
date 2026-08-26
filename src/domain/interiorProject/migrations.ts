import { WALL_GRAPH_DOMAIN_VERSION } from "./boxRoomGraphMigration";
import { DEFAULT_RENDER_SETTINGS } from "./defaults";
import { buildContiguousWallUses, pointKey } from "./planTopology";
import { INTERIOR_PROJECT_SCHEMA_VERSION } from "./types";

type UnknownRecord = Record<string, unknown>;

function optionalRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

export type InteriorMigrationResult = {
  document: unknown;
  fromVersion: number;
  toVersion: number;
  steps: string[];
};

function record(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Interior project document must be an object.");
  }
  return value as UnknownRecord;
}

function migrateV0ToV1(input: UnknownRecord): UnknownRecord {
  return {
    ...input,
    schemaVersion: 1,
    units: "mm",
    materials: Array.isArray(input.materials) ? input.materials : [],
    lights: Array.isArray(input.lights) ? input.lights : [],
    cameras: Array.isArray(input.cameras) ? input.cameras : [],
    renderSettings:
      input.renderSettings && typeof input.renderSettings === "object"
        ? input.renderSettings
        : { ...DEFAULT_RENDER_SETTINGS },
  };
}

function migrateV1ToV2(input: UnknownRecord): UnknownRecord {
  const walls = Array.isArray(input.walls) ? input.walls : [];
  const nodes: UnknownRecord[] = [];
  const nodeByPoint = new Map<string, string>();
  const nodeIdFor = (point: unknown) => {
    const value = optionalRecord(point);
    const x = Number(value.x) || 0;
    const z = Number(value.z) || 0;
    const key = pointKey({ x, z });
    const found = nodeByPoint.get(key);
    if (found) return found;
    const id = `node-${nodeByPoint.size + 1}`;
    nodeByPoint.set(key, id);
    nodes.push({ id, position: { x, z } });
    return id;
  };
  const upgradedWalls: UnknownRecord[] = walls.map((raw) => {
    const wall = record(raw);
    return {
      ...wall,
      startNodeId: nodeIdFor(wall.start),
      endNodeId: nodeIdFor(wall.end),
    };
  });
  const rooms = Array.isArray(input.rooms) ? input.rooms : [];
  const loops: UnknownRecord[] = [];
  const upgradedRooms = rooms.map((raw, index) => {
    const room = record(raw);
    const roomId = typeof room.id === "string" ? room.id : `room-${index + 1}`;
    const loopId = `${roomId}:outer-loop`;
    const roomWalls = upgradedWalls.filter((wall) => wall.roomId === roomId);
    const wallEntities = roomWalls.map((wall) => {
      const item = record(wall);
      return {
        id: String(item.id),
        roomId,
        start: { x: Number(optionalRecord(item.start).x) || 0, z: Number(optionalRecord(item.start).z) || 0 },
        end: { x: Number(optionalRecord(item.end).x) || 0, z: Number(optionalRecord(item.end).z) || 0 },
        heightMm: Number(item.heightMm) || 2800,
        thicknessMm: Number(item.thicknessMm) || 120,
        visible: item.visible !== false,
        materialId: null as null,
        startNodeId: typeof item.startNodeId === "string" ? item.startNodeId : undefined,
        endNodeId: typeof item.endNodeId === "string" ? item.endNodeId : undefined,
      };
    });
    loops.push({
      id: loopId,
      wallUses: buildContiguousWallUses(wallEntities),
      extensions: { migratedFrom: "v1-rectangular-shell" },
    });
    return { ...room, outerLoopId: loopId, holeLoopIds: [] };
  });
  const openings = (Array.isArray(input.openings) ? input.openings : []).map((raw) => {
    const opening = record(raw);
    const kind = opening.kind;
    const wallId = typeof opening.wallId === "string" ? opening.wallId : "";
    const host = upgradedWalls.find((wall) => wall.id === wallId);
    const hostRoomId = typeof host?.roomId === "string" ? host.roomId : null;
    const legacyRoomId = typeof opening.roomId === "string" ? opening.roomId : null;
    // Drop duplicated opening.roomId once the host wall is known; keep only if host missing.
    const roomId = hostRoomId && legacyRoomId && hostRoomId !== legacyRoomId
      ? legacyRoomId
      : undefined;
    return {
      ...opening,
      roomId,
      catalogItemId: typeof opening.catalogItemId === "string"
        ? opening.catalogItemId
        : kind === "door" ? "opening:door-single" : kind === "window" ? "opening:window-fixed" : "opening:pass-through",
      materialSlots: optionalRecord(opening.materialSlots),
      parameters: optionalRecord(opening.parameters),
    };
  });
  const extensions = optionalRecord(input.extensions);
  const singleRoomGraphReady = rooms.length === 1
    && upgradedWalls.every((wall) => typeof wall.startNodeId === "string" && typeof wall.endNodeId === "string");
  return {
    ...input,
    schemaVersion: 2,
    nodes,
    loops,
    rooms: upgradedRooms,
    walls: upgradedWalls,
    openings,
    surfaces: [],
    extensions: singleRoomGraphReady
      ? { ...extensions, wallGraphDomainVersion: WALL_GRAPH_DOMAIN_VERSION }
      : extensions,
  };
}

/** Apply each schema migration exactly once and reject unsupported future files. */
export function migrateInteriorProjectDocument(input: unknown): InteriorMigrationResult {
  let document = record(input);
  const rawVersion = Number(document.schemaVersion);
  const fromVersion = Number.isInteger(rawVersion) && rawVersion >= 0 ? rawVersion : 0;
  if (fromVersion > INTERIOR_PROJECT_SCHEMA_VERSION) {
    throw new Error(
      `Project schema v${fromVersion} is newer than supported v${INTERIOR_PROJECT_SCHEMA_VERSION}.`,
    );
  }

  let version = fromVersion;
  const steps: string[] = [];
  while (version < INTERIOR_PROJECT_SCHEMA_VERSION) {
    if (version === 0) {
      document = migrateV0ToV1(document);
      version = 1;
      steps.push("v0-to-v1");
      continue;
    }
    if (version === 1) {
      document = migrateV1ToV2(document);
      version = 2;
      steps.push("v1-to-v2");
      continue;
    }
    throw new Error(`No migration is registered for project schema v${version}.`);
  }

  return {
    document,
    fromVersion,
    toVersion: version,
    steps,
  };
}
