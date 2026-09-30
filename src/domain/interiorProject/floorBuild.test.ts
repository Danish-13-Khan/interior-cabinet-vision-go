import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compileLivingRoomScene, computeArchitectureBounds, createLivingRoomStarterProject } from "../livingRoom";
import { GOLDEN_RUN_FIXTURE_RELATIVE_PATH, serializeGoldenRunFixture } from "../livingRoom/goldenRun/serialize";
import {
  cabinetProjectFromInteriorProject,
  interiorProjectFromCabinetProject,
} from "./cabinetAdapter";
import { DEFAULT_FLOOR_BUILD, floorBottomMm, resolveFloorBuild, writeFloorBuild } from "./floorBuild";

const NOW = "2026-10-01T00:00:00.000Z";

describe("floor build", () => {
  it("resolves a missing setting to the legacy 12 mm slab", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const room = project.rooms[0]!;
    expect(resolveFloorBuild(room)).toEqual(DEFAULT_FLOOR_BUILD);
    expect(floorBottomMm(room)).toBe(-12);
    const floor = compileLivingRoomScene(project).nodes.find((node) => node.id.startsWith("room-floor:"));
    expect(floor?.primitives).toHaveLength(1);
    expect(floor?.primitives[0]).toMatchObject({ heightMm: 12, positionMm: { y: -6 } });
    expect(computeArchitectureBounds(compileLivingRoomScene(project).nodes).min.y).toBe(-12);
  });

  it("deepens bounds by structural plus flooring and leaves openings and cabinets at y = 0", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const room = project.rooms.find((item) => item.id === project.activeRoomId)!;
    const next = {
      ...project,
      rooms: project.rooms.map((item) => item.id === room.id
        ? writeFloorBuild(item, { structuralThicknessMm: 220, flooringThicknessMm: 18 })
        : item),
    };
    expect(floorBottomMm(next.rooms.find((item) => item.id === room.id)!)).toBe(-238);
    const scene = compileLivingRoomScene(next);
    expect(computeArchitectureBounds(scene.nodes).min.y).toBe(-238);
    const floor = scene.nodes.find((node) => node.metadata.role === "floor");
    expect(floor?.primitives.map((primitive) => primitive.materialId)).toContain("compiled:floor-structure");
    expect(next.openings.map((opening) => opening.sillHeightMm)).toEqual(project.openings.map((opening) => opening.sillHeightMm));
    expect(next.objects.filter((object) => object.kind === "cabinet").map((object) => object.position.y))
      .toEqual(project.objects.filter((object) => object.kind === "cabinet").map((object) => object.position.y));
    const cabinet = next.objects.find((object) => object.kind === "cabinet")!;
    const node = scene.nodes.find((item) => item.sourceObjectId === cabinet.id);
    expect(node?.positionMm.y).toBe(cabinet.position.y);
  });

  it("keeps room extensions across the cabinet adapter handoff", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const room = project.rooms.find((item) => item.id === project.activeRoomId)!;
    const stamped = {
      ...project,
      rooms: project.rooms.map((item) => item.id === room.id
        ? writeFloorBuild({ ...item, extensions: { ...item.extensions, floorMaterialId: "floor-oak" } }, {
          structuralThicknessMm: 60,
          flooringThicknessMm: 12,
        })
        : item),
    };
    const compat = cabinetProjectFromInteriorProject(stamped);
    const back = interiorProjectFromCabinetProject({ project: compat.project, activeRoom: compat.room, now: NOW });
    const restored = back.rooms.find((item) => item.id === room.id);
    expect(restored?.extensions?.floorBuild).toEqual({ structuralThicknessMm: 60, flooringThicknessMm: 12 });
    expect(restored?.extensions?.floorMaterialId).toBe("floor-oak");
    expect(restored?.extensions?.managedBy).toBe("interior-cabinet-adapter");
  });

  it("leaves the golden fixture byte-identical", () => {
    const path = join(dirname(fileURLToPath(import.meta.url)), "../../../", GOLDEN_RUN_FIXTURE_RELATIVE_PATH);
    expect(readFileSync(path, "utf8")).toBe(serializeGoldenRunFixture());
  });
});
