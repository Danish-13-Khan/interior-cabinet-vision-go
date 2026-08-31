import { describe, expect, it } from "vitest";
import { cabinetProjectFromInteriorProject, roomPlanPolygon } from "../interiorProject";
import { compileLivingRoomScene } from "./sceneCompiler";
import { createLivingRoomStarterProject } from "./preset";
import {
  applyPlannerStarterTemplate,
  L_ROOM_STARTER_POINTS,
} from "./plannerStarters";

const NOW = "2026-08-29T00:00:00.000Z";

describe("planner starter templates", () => {
  it("starts blank and import templates with no rooms or furniture", () => {
    const base = createLivingRoomStarterProject({ now: NOW });
    const blank = applyPlannerStarterTemplate(base, "blank-room");
    expect(blank.objects).toEqual([]);
    expect(blank.rooms).toEqual([]);
    expect(blank.walls).toEqual([]);
    expect(blank.openings).toEqual([]);
    expect(applyPlannerStarterTemplate(base, "import-plan").rooms).toEqual([]);
    expect(cabinetProjectFromInteriorProject(blank).project.interiorDocument?.rooms).toEqual([]);
  });

  it("keeps cabinets only for wardrobe-wall", () => {
    const next = applyPlannerStarterTemplate(
      createLivingRoomStarterProject({ now: NOW }),
      "wardrobe-wall",
    );
    expect(next.objects.length).toBeGreaterThan(0);
    expect(next.objects.every((object) => object.kind === "cabinet")).toBe(true);
  });

  it("builds a single L-room face with six boundary walls", () => {
    const source = createLivingRoomStarterProject({ now: NOW });
    const sourceFloor = source.rooms[0]?.extensions?.floorMaterialId;
    const sourceCeiling = source.rooms[0]?.extensions?.ceilingMaterialId;
    expect(typeof sourceFloor).toBe("string");
    expect(typeof sourceCeiling).toBe("string");

    const next = applyPlannerStarterTemplate(source, "l-room");
    expect(next.rooms).toHaveLength(1);
    expect(next.rooms[0]?.name).toBe("L Room");
    expect(next.walls.every((wall) => wall.raised !== false)).toBe(true);
    expect(next.rooms[0]?.extensions?.floorMaterialId).toBe(sourceFloor);
    expect(next.rooms[0]?.extensions?.ceilingMaterialId).toBe(sourceCeiling);
    expect(roomPlanPolygon(next, next.activeRoomId)?.outer).toHaveLength(L_ROOM_STARTER_POINTS.length);
    expect(next.cameras.length).toBeGreaterThan(0);

    const floor = next.surfaces.find((surface) =>
      surface.roomId === next.activeRoomId && surface.kind === "floor");
    expect(floor?.materialId).toBe(sourceFloor);
    expect(compileLivingRoomScene(next).nodes.some((node) => node.metadata?.role === "floor")).toBe(true);
  });

  it("splits into Living and Bedroom faces for 2-room-flat", () => {
    const next = applyPlannerStarterTemplate(
      createLivingRoomStarterProject({ now: NOW }),
      "2-room-flat",
    );
    expect(next.rooms).toHaveLength(2);
    expect(next.rooms.map((room) => room.name).sort()).toEqual(["Bedroom", "Living"]);
    expect(next.objects).toEqual([]);
    expect(compileLivingRoomScene(next).nodes.length).toBeGreaterThan(0);
  });
});
