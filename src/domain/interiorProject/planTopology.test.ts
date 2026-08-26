import { describe, expect, it } from "vitest";
import rectangleV1 from "../../../fixtures/plan-topology/v1-rectangle.interior.json";
import v1TwoRoomsAdjacent from "../../../fixtures/plan-topology/v1-two-rooms-adjacent.interior.json";
import rectangleV2 from "../../../fixtures/plan-topology/rectangle.v2.golden.json";
import lRoomV2 from "../../../fixtures/plan-topology/l-room.v2.golden.json";
import sharedWallV2 from "../../../fixtures/plan-topology/two-rooms-shared-wall.v2.golden.json";
import boxMigrationGolden from "../../../fixtures/plan-topology/two-rooms-from-box-migration.v2.golden.json";
import { loadInteriorProjectFile } from "./fileFormat";
import { roomIdsUsingWall, selectOpeningsForRoom, selectWallsForRoom } from "./planTopology";
import { topologyGoldenSnapshot } from "./topologyGoldenSnapshots";
import { validateInteriorProject } from "./validation";

describe("schema v2 plan topology foundation", () => {
  it("loads the rectangle golden without topology errors", () => {
    const before = topologyGoldenSnapshot(rectangleV2);
    const result = validateInteriorProject(rectangleV2);
    expect(result.project.schemaVersion).toBe(2);
    expect(result.project.nodes).toHaveLength(4);
    expect(result.project.loops).toHaveLength(1);
    expect(result.project.extensions?.wallGraphDomainVersion).toBe(1);
    expect(topologyGoldenSnapshot(result.project)).toEqual(before);
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(result.project.openings[0]?.catalogItemId).toBe("opening:door-single");
    expect(result.project.openings[0]?.roomId == null).toBe(true);
  });

  it("loads the L-room golden as one closed six-wall loop", () => {
    const result = validateInteriorProject(lRoomV2);
    expect(result.project.rooms).toHaveLength(1);
    expect(result.project.walls).toHaveLength(6);
    expect(result.project.loops[0]?.wallUses).toHaveLength(6);
    expect(result.issues.filter((issue) => issue.code === "loop-not-closed")).toEqual([]);
    expect(selectWallsForRoom(result.project, "room-l")).toHaveLength(6);
  });

  it("accepts a shared wall owned by two room loops without roomId", () => {
    const result = validateInteriorProject(sharedWallV2);
    expect(result.project.rooms).toHaveLength(2);
    expect(result.project.walls).toHaveLength(7);
    expect(roomIdsUsingWall(result.project, "wall-shared")).toEqual(["room-left", "room-right"]);
    expect(result.project.walls.find((wall) => wall.id === "wall-shared")?.roomId == null).toBe(true);
    expect(selectWallsForRoom(result.project, "room-left").map((wall) => wall.id)).toContain("wall-shared");
    expect(selectWallsForRoom(result.project, "room-right").map((wall) => wall.id)).toContain("wall-shared");
    expect(selectOpeningsForRoom(result.project, "room-left").map((opening) => opening.id)).toContain("door-shared");
    expect(selectOpeningsForRoom(result.project, "room-right").map((opening) => opening.id)).toContain("door-shared");
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("migrates the v1 rectangle fixture onto the rectangle golden shape", () => {
    const loaded = loadInteriorProjectFile(rectangleV1);
    expect(loaded.migrationSteps).toEqual(["v1-to-v2"]);
    expect(loaded.document.extensions?.wallGraphDomainVersion).toBe(1);
    expect(loaded.document.nodes).toHaveLength(4);
    expect(loaded.document.walls.map(({ id, start, end, startNodeId, endNodeId }) => ({
      id, start, end, startNodeId, endNodeId,
    }))).toEqual(rectangleV2.walls.map(({ id, start, end, startNodeId, endNodeId }) => ({
      id, start, end, startNodeId, endNodeId,
    })));
    expect(loaded.document.loops[0]?.wallUses.map((use) => use.wallId)).toEqual(
      rectangleV2.loops[0]?.wallUses.map((use) => use.wallId),
    );
    expect(loaded.document.openings[0]).toMatchObject({
      id: "door-main",
      wallId: "wall-front",
      catalogItemId: "opening:door-single",
    });
    expect(loaded.document.openings[0]?.roomId == null).toBe(true);
  });

  it("loads the box-migration golden as a canonical shared-wall graph", () => {
    const result = validateInteriorProject(boxMigrationGolden);
    expect(topologyGoldenSnapshot(result.project)).toEqual(topologyGoldenSnapshot(boxMigrationGolden));
    expect(result.project.walls).toHaveLength(7);
    expect(roomIdsUsingWall(result.project, "left-shared")).toEqual(["room-left", "room-right"]);
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("merges v1 adjacent box rooms through load and validate onto the box-migration golden", () => {
    const loaded = loadInteriorProjectFile(v1TwoRoomsAdjacent);
    expect(loaded.migrationSteps).toEqual(["v1-to-v2"]);
    expect(loaded.document.walls).toHaveLength(7);
    expect(loaded.document.extensions?.wallGraphDomainVersion).toBe(1);
    expect(loaded.document.openings[0]).toMatchObject({
      id: "shared-door",
      wallId: "left-shared",
      catalogItemId: "opening:door-single",
    });
    expect(loaded.document.openings[0]?.roomId == null).toBe(true);
    expect(topologyGoldenSnapshot(loaded.document)).toEqual(topologyGoldenSnapshot(boxMigrationGolden));
    expect(loaded.issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });
});
