import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { roomPlanPolygon, roomPolygonIsValid } from "./roomGeometry";
import { validateInteriorProject } from "./validation";
import { movePlanNodeWithOpenings, translatePlanWall } from "./wallEditingMove";
import { createWallGraphIndex, movePlanNode } from "./wallGraph";

describe("H2 wall node move / wall translate", () => {
  it("moves a corner node with snap and keeps openings valid", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const corner = source.nodes.find((node) =>
      Math.abs(node.position.x - 3100) < 1 && Math.abs(node.position.z - 2300) < 1)!;
    const next = movePlanNodeWithOpenings(source, corner.id, { x: 3200, z: 2400 }, { snapSizeMm: 50 });
    const moved = next.nodes.find((node) => node.id === corner.id)!;
    expect(moved.position).toEqual({ x: 3200, z: 2400 });
    expect(next.walls.some((wall) =>
      (wall.startNodeId === corner.id || wall.endNodeId === corner.id)
      && (wall.start.x !== source.walls.find((item) => item.id === wall.id)!.start.x
        || wall.start.z !== source.walls.find((item) => item.id === wall.id)!.start.z
        || wall.end.x !== source.walls.find((item) => item.id === wall.id)!.end.x
        || wall.end.z !== source.walls.find((item) => item.id === wall.id)!.end.z))).toBe(true);
    expect(validateInteriorProject(next).issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("refuses a node move that would collapse an edge below the minimum length", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const corner = source.nodes.find((node) =>
      Math.abs(node.position.x + 3100) < 1 && Math.abs(node.position.z + 2300) < 1)!;
    const neighbor = source.nodes.find((node) =>
      Math.abs(node.position.x - 3100) < 1 && Math.abs(node.position.z + 2300) < 1)!;
    const next = movePlanNodeWithOpenings(source, corner.id, neighbor.position, {
      snapSizeMm: 50, joinCoincident: false,
    });
    expect(next).toBe(source);
  });

  it("refuses a node move that would self-intersect a room loop", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const corner = source.nodes.find((node) =>
      Math.abs(node.position.x - 3100) < 1 && Math.abs(node.position.z - 2300) < 1)!;
    const invalidTarget = { x: -4000, z: 0 };
    const provisional = movePlanNode(source, corner.id, invalidTarget);
    const polygon = roomPlanPolygon(provisional, source.activeRoomId);
    expect(polygon && roomPolygonIsValid(polygon)).toBe(false);
    const next = movePlanNodeWithOpenings(source, corner.id, invalidTarget, { joinCoincident: false });
    expect(next).toBe(source);
  });

  it("translates a wall while preserving its length and updating incident caches", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const front = source.walls.find((wall) => wall.extensions?.wallSide === "front")!;
    const before = Math.hypot(front.end.x - front.start.x, front.end.z - front.start.z);
    const next = translatePlanWall(source, front.id, { x: 0, z: 200 }, { snapSizeMm: 50 });
    const moved = next.walls.find((wall) => wall.id === front.id)!;
    const after = Math.hypot(moved.end.x - moved.start.x, moved.end.z - moved.start.z);
    expect(Math.abs(after - before)).toBeLessThan(0.01);
    expect(moved.start.z).toBe(front.start.z + 200);
    expect(moved.end.z).toBe(front.end.z + 200);
    expect(createWallGraphIndex(next).nodesById.get(front.startNodeId!)?.position.z).toBe(front.start.z + 200);
    expect(validateInteriorProject(next).issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });
});
