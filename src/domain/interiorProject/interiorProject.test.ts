import { describe, expect, it } from "vitest";
import {
  defaultCabinetProject,
  clampCabinetProject,
  getDefaultCabinetConfig,
} from "../cabinetDimensions";
import {
  addEmptyProjectRoom,
  getActiveProjectRoom,
  listProjectRooms,
  normalizeMultiRoomProject,
  writeActiveRoomState,
} from "../projectRooms";
import { DEFAULT_ROOM } from "../roomModel";
import {
  cabinetProjectFromInteriorProject,
  interiorProjectFromCabinetProject,
} from "./cabinetAdapter";
import {
  createInteriorProjectFile,
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
} from "./fileFormat";
import { validateInteriorProject } from "./validation";

const NOW = "2026-08-11T16:12:01.000Z";

function canonicalDefault() {
  return interiorProjectFromCabinetProject({
    project: defaultCabinetProject,
    activeRoom: DEFAULT_ROOM,
    now: NOW,
  });
}

describe("InteriorProject universal spine", () => {
  it("round-trips the cabinet project, room, openings, and project shell", () => {
    const document = canonicalDefault();
    const restored = cabinetProjectFromInteriorProject(document);

    expect(document.schemaVersion).toBe(1);
    expect(document.units).toBe("mm");
    expect(document.rooms).toHaveLength(1);
    expect(document.walls).toHaveLength(4);
    expect(document.openings).toHaveLength(
      DEFAULT_ROOM.doors.length + DEFAULT_ROOM.windows.length,
    );
    expect(document.objects).toHaveLength(defaultCabinetProject.cabinets.length);
    expect(restored.project.cabinets[0]!.config).toEqual(
      clampCabinetProject(defaultCabinetProject).cabinets[0]!.config,
    );
    expect(restored.project.layers).toEqual(defaultCabinetProject.layers);
    expect(restored.room).toEqual(DEFAULT_ROOM);
  });

  it("preserves every room and its cabinets through canonical conversion", () => {
    let project = normalizeMultiRoomProject(defaultCabinetProject, DEFAULT_ROOM);
    project = addEmptyProjectRoom(project, project.cabinets, DEFAULT_ROOM, "Utility");
    project = writeActiveRoomState(
      project,
      [
        {
          id: "utility-tall",
          name: "Utility Tall",
          placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
          config: getDefaultCabinetConfig("tall"),
        },
      ],
      { ...DEFAULT_ROOM, dimensions: { ...DEFAULT_ROOM.dimensions, widthMm: 4200 } },
    );

    const active = getActiveProjectRoom(project);
    const document = interiorProjectFromCabinetProject({
      project,
      activeRoom: active.config,
      now: NOW,
    });
    const restored = cabinetProjectFromInteriorProject(document).project;
    const rooms = listProjectRooms(restored);

    expect(document.rooms).toHaveLength(2);
    expect(rooms).toHaveLength(2);
    expect(rooms.find((room) => room.name === "Utility")!.cabinets[0]!.id).toBe(
      "utility-tall",
    );
    expect(rooms.find((room) => room.name === "Utility")!.config.dimensions.widthMm).toBe(4200);
    expect(restored.activeRoomId).toBe(project.activeRoomId);
  });

  it("carries future furniture, materials, lights, and cameras through cabinet editing", () => {
    const document = canonicalDefault();
    const roomId = document.activeRoomId;
    document.materials.push({
      id: "fabric-sand",
      name: "Sand Fabric",
      kind: "fabric",
      color: "#c8b79f",
      roughness: 0.9,
      metalness: 0,
      opacity: 1,
    });
    document.objects.push({
      id: "sofa-1",
      roomId,
      kind: "furniture",
      category: "sofa",
      catalogItemId: "living:sofa-3-seat",
      name: "Three Seat Sofa",
      position: { x: 0, y: 0, z: 900 },
      rotation: { x: 0, y: 180, z: 0 },
      dimensions: { widthMm: 2200, heightMm: 850, depthMm: 900 },
      materialSlots: { upholstery: "fabric-sand" },
      parameters: { seats: 3 },
    });
    document.lights.push({
      id: "ambient-1",
      roomId,
      name: "Ambient",
      kind: "ambient",
      position: { x: 0, y: 2200, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      color: "#ffffff",
      intensity: 0.7,
      enabled: true,
      parameters: {},
    });
    document.cameras.push({
      id: "camera-wide",
      roomId,
      name: "Wide",
      position: { x: 3200, y: 1800, z: 3000 },
      target: { x: 0, y: 900, z: 0 },
      fieldOfViewDegrees: 45,
      isDefault: true,
    });

    const compatible = cabinetProjectFromInteriorProject(document);
    compatible.project.cabinets[0]!.name = "Edited Cabinet";
    const resaved = interiorProjectFromCabinetProject({
      project: compatible.project,
      activeRoom: compatible.room,
      now: "2026-08-11T17:00:00.000Z",
    });

    expect(resaved.objects.find((object) => object.id === "sofa-1")).toEqual(
      document.objects.find((object) => object.id === "sofa-1"),
    );
    expect(resaved.materials).toEqual(document.materials);
    expect(resaved.lights).toEqual(document.lights);
    expect(resaved.cameras).toEqual(document.cameras);
    expect(resaved.objects.find((object) => object.kind === "cabinet")!.name).toBe(
      "Edited Cabinet",
    );
  });

  it("repairs malformed values and removes orphaned entities safely", () => {
    const document = canonicalDefault() as unknown as Record<string, unknown>;
    const rooms = document.rooms as Array<Record<string, unknown>>;
    rooms[0]!.dimensions = { widthMm: -100, heightMm: "bad", depthMm: 0 };
    const objects = document.objects as Array<Record<string, unknown>>;
    objects.push({
      id: "orphan",
      roomId: "missing-room",
      kind: "furniture",
      category: "chair",
    });

    const result = validateInteriorProject(document);

    expect(result.project.rooms[0]!.dimensions.widthMm).toBe(1);
    expect(result.project.rooms[0]!.dimensions.heightMm).toBe(2800);
    expect(result.project.objects.some((object) => object.id === "orphan")).toBe(false);
    expect(result.issues.some((issue) => issue.code === "orphan-object")).toBe(true);
  });

  it("serializes and reloads the canonical file envelope", () => {
    const document = canonicalDefault();
    const serialized = serializeInteriorProjectFile(document, NOW);
    const raw = JSON.parse(serialized) as Record<string, unknown>;
    const loaded = loadInteriorProjectFile(serialized);

    expect(raw.format).toBe("interior-project");
    expect(raw.schemaVersion).toBe(1);
    expect(loaded.source).toBe("interior-project-v1");
    expect(loaded.document.id).toBe(document.id);
    expect(loaded.project.cabinets).toHaveLength(1);
  });

  it("migrates the wrapped cabinet project format", () => {
    const loaded = loadInteriorProjectFile({
      version: 3,
      project: defaultCabinetProject,
      room: DEFAULT_ROOM,
    });

    expect(loaded.source).toBe("cabinet-project-wrapper");
    expect(loaded.document.objects[0]!.kind).toBe("cabinet");
    expect(loaded.project.cabinets[0]!.id).toBe("cabinet-1");
  });

  it("migrates the historical single-cabinet format", () => {
    const loaded = loadInteriorProjectFile({
      config: getDefaultCabinetConfig("drawer"),
    });

    expect(loaded.source).toBe("single-cabinet-config");
    expect(loaded.project.cabinets[0]!.config.type).toBe("drawer");
  });

  it("rejects files created by unsupported future schemas", () => {
    const file = createInteriorProjectFile(canonicalDefault(), NOW) as unknown as {
      project: Record<string, unknown>;
    };
    file.project.schemaVersion = 99;

    expect(() => loadInteriorProjectFile(file)).toThrow("newer than supported");
  });

  it("runs explicit migrations for pre-versioned interior documents", () => {
    const document = canonicalDefault() as unknown as Record<string, unknown>;
    delete document.schemaVersion;
    delete document.renderSettings;
    delete document.materials;

    const loaded = loadInteriorProjectFile(document);

    expect(loaded.migrationSteps).toEqual(["v0-to-v1"]);
    expect(loaded.document.schemaVersion).toBe(1);
    expect(loaded.document.renderSettings.widthPx).toBe(1920);
    expect(loaded.document.materials).toEqual([]);
  });

  it("repairs dangling material and active-camera references", () => {
    const document = canonicalDefault();
    document.objects[0]!.materialSlots = { carcass: "missing-material" };
    document.walls[0]!.materialId = "missing-material";
    document.renderSettings.activeCameraId = "missing-camera";

    const result = validateInteriorProject(document);

    expect(result.project.objects[0]!.materialSlots).toEqual({});
    expect(result.project.walls[0]!.materialId).toBeNull();
    expect(result.project.renderSettings.activeCameraId).toBeNull();
    expect(result.issues.filter((issue) => issue.code === "missing-material")).toHaveLength(2);
  });

  it("keeps canonical metadata when constructing a compatibility project", () => {
    const document = canonicalDefault();
    document.name = "Living Room Study";
    document.renderSettings.quality = "presentation";
    const compatible = cabinetProjectFromInteriorProject(document);
    const roundTrip = interiorProjectFromCabinetProject({
      project: compatible.project,
      activeRoom: compatible.room,
      now: NOW,
    });

    expect(roundTrip.id).toBe(document.id);
    expect(roundTrip.renderSettings.quality).toBe("presentation");
  });

  it("treats canonical object geometry and parameters as cabinet source data", () => {
    const document = canonicalDefault();
    const cabinet = document.objects.find((object) => object.kind === "cabinet")!;
    cabinet.dimensions.widthMm = 1200;
    cabinet.parameters.shelfCount = 2;
    cabinet.parameters.hasDoors = false;

    const compatible = cabinetProjectFromInteriorProject(document);
    const config = compatible.project.cabinets[0]!.config;

    expect(config.dimensions.width).toBe(1200);
    expect(config.shelfCount).toBe(2);
    expect(config.hasDoors).toBe(false);
  });
});
