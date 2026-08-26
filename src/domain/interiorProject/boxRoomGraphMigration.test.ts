import { describe, expect, it } from "vitest";
import boxMigrationGolden from "../../../fixtures/plan-topology/two-rooms-from-box-migration.v2.golden.json";
import { createEmptyInteriorProject } from "./defaults";
import { migrateBoxRoomsToWallGraph } from "./boxRoomGraphMigration";
import { roomIdsUsingWall } from "./planTopology";
import { topologyGoldenSnapshot } from "./topologyGoldenSnapshots";
import { validateInteriorProject } from "./validation";
import { createWallGraphIndex, movePlanNode, wallDegree } from "./wallGraph";
import type { InteriorProject, WallEntity } from "./types";

function wall(id: string, roomId: string, start: [number, number], end: [number, number]): WallEntity {
  return {
    id, roomId, start: { x: start[0], z: start[1] }, end: { x: end[0], z: end[1] },
    heightMm: 2800, thicknessMm: 120, visible: true, materialId: null,
  };
}

function adjacentBoxProject(): InteriorProject {
  const base = createEmptyInteriorProject({ id: "adjacent-boxes", name: "Adjacent boxes", now: "2026-08-27T00:00:00.000Z" });
  return {
    ...base,
    activeRoomId: "room-left",
    rooms: [
      { id: "room-left", name: "Left", roomType: "custom", dimensions: { widthMm: 3000, heightMm: 2800, depthMm: 3000 }, wallThicknessMm: 120 },
      { id: "room-right", name: "Right", roomType: "custom", dimensions: { widthMm: 3000, heightMm: 2800, depthMm: 3000 }, wallThicknessMm: 120 },
    ],
    walls: [
      wall("left-top", "room-left", [0, 0], [3000, 0]),
      wall("left-shared", "room-left", [3000, 0], [3000, 3000]),
      wall("left-bottom", "room-left", [3000, 3000], [0, 3000]),
      wall("left-outer", "room-left", [0, 3000], [0, 0]),
      wall("right-top", "room-right", [3000, 0], [6000, 0]),
      wall("right-outer", "room-right", [6000, 0], [6000, 3000]),
      wall("right-bottom", "room-right", [6000, 3000], [3000, 3000]),
      wall("right-shared", "room-right", [3000, 3000], [3000, 0]),
    ],
    openings: [{
      id: "shared-door", roomId: "room-right", wallId: "right-shared", kind: "door",
      offsetMm: 800, widthMm: 900, heightMm: 2100, sillHeightMm: 0,
    }],
  };
}

describe("D1 box-room wall graph migration", () => {
  it("merges duplicate boundaries and remaps hosted openings", () => {
    const migrated = migrateBoxRoomsToWallGraph(adjacentBoxProject());
    expect(migrated.nodes).toHaveLength(6);
    expect(migrated.walls).toHaveLength(7);
    expect(migrated.openings[0]?.wallId).toBe("left-shared");
    expect(migrated.openings[0]?.roomId).toBeUndefined();
    expect(migrated.walls.find((item) => item.id === "left-shared")?.roomId).toBeNull();
    expect(roomIdsUsingWall(migrated, "left-shared")).toEqual(["room-left", "room-right"]);
    const uses = migrated.loops.map((loop) => loop.wallUses.find((use) => use.wallId === "left-shared")?.direction);
    expect(new Set(uses)).toEqual(new Set(["forward", "reverse"]));
    expect(validateInteriorProject(migrated).issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("treats nodes as authoritative and synchronizes wall caches", () => {
    const migrated = migrateBoxRoomsToWallGraph(adjacentBoxProject());
    const shared = migrated.walls.find((item) => item.id === "left-shared")!;
    const moved = movePlanNode(migrated, shared.startNodeId!, { x: 3250, z: 0 });
    expect(moved.walls.find((item) => item.id === shared.id)?.start).toEqual({ x: 3250, z: 0 });
    const index = createWallGraphIndex(moved);
    expect(wallDegree(index, shared.startNodeId!)).toBe(3);
  });

  it("is idempotent after the canonical graph is established", () => {
    const once = migrateBoxRoomsToWallGraph(adjacentBoxProject());
    const twice = migrateBoxRoomsToWallGraph(once);
    expect(twice.nodes).toEqual(once.nodes);
    expect(twice.walls).toEqual(once.walls);
    expect(twice.loops).toEqual(once.loops);
  });

  it("matches the persisted box-migration golden fixture", () => {
    const migrated = migrateBoxRoomsToWallGraph(adjacentBoxProject());
    const normalized = {
      ...migrated,
      openings: migrated.openings.map((opening) => ({
        ...opening,
        catalogItemId: opening.catalogItemId ?? "opening:door-single",
        materialSlots: opening.materialSlots ?? {},
        parameters: opening.parameters ?? {},
      })),
    };
    expect(topologyGoldenSnapshot(normalized)).toEqual(topologyGoldenSnapshot(boxMigrationGolden));
  });
});
