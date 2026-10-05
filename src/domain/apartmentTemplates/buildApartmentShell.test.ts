import { describe, expect, it } from "vitest";
import {
  roomPlanPolygon,
  validateInteriorProject,
} from "../interiorProject";
import { roomIdsUsingWall } from "../interiorProject/planTopology";
import { applyPlannerStarterTemplate } from "../livingRoom/plannerStarters";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import {
  APARTMENT_SHELL_SPECS,
  THREE_BHK_SHELL_SPEC,
  TWO_ROOM_FLAT_SPEC,
  apartmentIdFactory,
  buildApartmentShell,
  sharedWallBetween,
} from "./index";

const NOW = "2026-10-05T00:00:00.000Z";

function assertClosedLoops(project: ReturnType<typeof buildApartmentShell>) {
  for (const room of project.rooms) {
    const polygon = roomPlanPolygon(project, room.id);
    expect(polygon, `${room.name} closed loop`).not.toBeNull();
    expect((polygon?.outer.length ?? 0) >= 3).toBe(true);
  }
}

describe("Phase 0 apartment shell builder", () => {
  it("builds all four template shells with zero repairs", () => {
    for (const spec of APARTMENT_SHELL_SPECS) {
      const project = buildApartmentShell(spec, { now: NOW });
      const result = validateInteriorProject(project);
      expect(result.issues.filter((i) => i.repaired)).toEqual([]);
      expect(result.issues.filter((i) => i.severity === "error")).toEqual([]);
      expect(project.rooms.length).toBe(spec.rooms.length);
      assertClosedLoops(project);
    }
  });

  it("places every interior door on a shared wall", () => {
    for (const spec of APARTMENT_SHELL_SPECS) {
      const project = buildApartmentShell(spec, { now: NOW });
      const keyToId = new Map(
        project.rooms.map((room) => [
          String(room.extensions?.apartmentRoomKey ?? ""),
          room.id,
        ]),
      );
      for (const opening of spec.openings) {
        if (!Array.isArray(opening.between) || opening.kind === "window") continue;
        const a = keyToId.get(opening.between[0])!;
        const b = keyToId.get(opening.between[1])!;
        const wall = sharedWallBetween(project, a, b);
        expect(wall, `${spec.id} ${opening.between.join("-")}`).not.toBeNull();
        const placed = project.openings.find(
          (item) => item.wallId === wall!.id && item.kind === opening.kind,
        );
        expect(placed).toBeTruthy();
        expect(roomIdsUsingWall(project, wall!.id).sort()).toEqual([a, b].sort());
      }
    }
  });

  it("keeps exterior openings on exterior walls with authored size/offset", () => {
    for (const spec of APARTMENT_SHELL_SPECS) {
      const project = buildApartmentShell(spec, { now: NOW });
      const keyToId = new Map(
        project.rooms.map((room) => [
          String(room.extensions?.apartmentRoomKey ?? ""),
          room.id,
        ]),
      );
      const ids = apartmentIdFactory(spec.id);
      spec.openings.forEach((opening, index) => {
        const placed = project.openings.find((item) => item.id === ids("opening", `o${index}`));
        expect(placed, `${spec.id} opening #${index}`).toBeTruthy();
        expect(placed!.widthMm).toBe(opening.widthMm);
        expect(placed!.offsetMm).toBe(opening.offsetMm);
        if (Array.isArray(opening.between)) return;
        const roomId = keyToId.get(opening.between.room)!;
        expect(roomIdsUsingWall(project, placed!.wallId)).toEqual([roomId]);
      });
    }
  });

  it("is deterministic: two builds are byte-identical JSON", () => {
    const a = buildApartmentShell(APARTMENT_SHELL_SPECS[0]!, { now: NOW });
    const b = buildApartmentShell(APARTMENT_SHELL_SPECS[0]!, { now: NOW });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("re-expresses 2-room-flat with the same topology", () => {
    const starter = applyPlannerStarterTemplate(
      createLivingRoomStarterProject({ now: NOW }),
      "2-room-flat",
    );
    const fromSpec = buildApartmentShell(TWO_ROOM_FLAT_SPEC, { now: NOW });
    expect(fromSpec.rooms).toHaveLength(2);
    expect(starter.rooms).toHaveLength(2);
    expect(fromSpec.rooms.map((r) => r.name).sort()).toEqual(["Bedroom", "Living"]);
    expect(starter.rooms.map((r) => r.name).sort()).toEqual(["Bedroom", "Living"]);
    const living = fromSpec.rooms.find((r) => r.name === "Living")!;
    const bedroom = fromSpec.rooms.find((r) => r.name === "Bedroom")!;
    expect(sharedWallBetween(fromSpec, living.id, bedroom.id)).not.toBeNull();
    assertClosedLoops(fromSpec);
    assertClosedLoops(starter);
  });

  it("D2 spike: 3 BHK guillotine (≥8 cuts, T-junctions) stays valid", () => {
    expect(THREE_BHK_SHELL_SPEC.splits.length).toBeGreaterThanOrEqual(8);
    const project = buildApartmentShell(THREE_BHK_SHELL_SPEC, { now: NOW });
    const result = validateInteriorProject(project);
    expect(result.issues.filter((i) => i.repaired)).toEqual([]);
    expect(result.issues.filter((i) => i.severity === "error")).toEqual([]);
    assertClosedLoops(project);
    const degree = new Map<string, number>();
    for (const wall of project.walls) {
      if (!wall.startNodeId || !wall.endNodeId) continue;
      degree.set(wall.startNodeId, (degree.get(wall.startNodeId) ?? 0) + 1);
      degree.set(wall.endNodeId, (degree.get(wall.endNodeId) ?? 0) + 1);
    }
    expect([...degree.values()].some((count) => count >= 3)).toBe(true);
  });
});
