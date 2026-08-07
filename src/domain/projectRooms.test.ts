import { describe, expect, it } from "vitest";
import { defaultCabinetProject, getDefaultCabinetConfig } from "./cabinetDimensions";
import { DEFAULT_ROOM } from "./roomModel";
import {
  addEmptyProjectRoom,
  createWholeProjectReport,
  duplicateProjectRoom,
  getActiveProjectRoom,
  getRoomTemplate,
  listProjectRooms,
  normalizeMultiRoomProject,
  switchProjectRoom,
  writeActiveRoomState,
} from "./projectRooms";

describe("project rooms", () => {
  it("migrates legacy single-room projects", () => {
    const normalized = normalizeMultiRoomProject(defaultCabinetProject, DEFAULT_ROOM);
    expect(normalized.rooms).toHaveLength(1);
    expect(normalized.activeRoomId).toBe(normalized.rooms![0]!.id);
    expect(normalized.cabinets).toHaveLength(defaultCabinetProject.cabinets.length);
  });

  it("switches rooms and preserves cabinets per room", () => {
    let project = normalizeMultiRoomProject(defaultCabinetProject, DEFAULT_ROOM);
    project = addEmptyProjectRoom(project, project.cabinets, DEFAULT_ROOM, "Bath");
    expect(listProjectRooms(project)).toHaveLength(2);
    expect(getActiveProjectRoom(project).name).toBe("Bath");
    expect(project.cabinets).toHaveLength(0);

    const rooms = listProjectRooms(project);
    const firstId = rooms[0]!.id;
    project = switchProjectRoom(project, firstId, project.cabinets, DEFAULT_ROOM);
    expect(getActiveProjectRoom(project).id).toBe(firstId);
    expect(project.cabinets.length).toBeGreaterThan(0);
  });

  it("duplicates a room with fresh cabinet ids", () => {
    const base = writeActiveRoomState(
      defaultCabinetProject,
      [
        {
          id: "cab-a",
          name: "Base A",
          placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
          config: getDefaultCabinetConfig("base"),
        },
      ],
      DEFAULT_ROOM,
    );
    const duplicated = duplicateProjectRoom(
      base,
      getActiveProjectRoom(base).id,
      base.cabinets,
      DEFAULT_ROOM,
    );
    expect(listProjectRooms(duplicated)).toHaveLength(2);
    const ids = duplicated.cabinets.map((cabinet) => cabinet.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("aggregates whole-project schedule and costing", () => {
    let project = normalizeMultiRoomProject(defaultCabinetProject, DEFAULT_ROOM);
    project = addEmptyProjectRoom(project, project.cabinets, DEFAULT_ROOM, "Utility");
    project = writeActiveRoomState(
      project,
      [
        {
          id: "util-1",
          name: "Tall Store",
          placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
          config: getDefaultCabinetConfig("tall"),
        },
      ],
      DEFAULT_ROOM,
    );
    project = normalizeMultiRoomProject(project, DEFAULT_ROOM);

    const whole = createWholeProjectReport(project);
    expect(whole.roomCount).toBe(2);
    expect(whole.totalItemCount).toBeGreaterThanOrEqual(2);
    expect(whole.schedule.length).toBe(whole.totalItemCount);
    expect(whole.roomSummaries).toHaveLength(2);
    expect(whole.totalCost).toBeGreaterThanOrEqual(0);
  });

  it("preserves preset room dimensions when creating rooms from templates", () => {
    const template = getRoomTemplate("small-bedroom");
    expect(template).not.toBeNull();
    const room = template!.build();
    expect(room.config.dimensions.widthMm).toBe(4200);
    expect(room.config.dimensions.depthMm).toBe(3400);
  });
});
