import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { compileLivingRoomScene } from "../livingRoom/sceneCompiler";
import { migrateBoxRoomsToWallGraph } from "./boxRoomGraphMigration";
import { createEmptyInteriorProject } from "./defaults";
import { drawRoomFromPoints, rectanglePoints } from "./roomDrawing";
import { roomIdsUsingWall } from "./planTopology";
import { validateInteriorProject } from "./validation";
import {
  createWallSegment,
  createWallSegmentResult,
  deletePlanWall,
  joinPlanNodes,
  mergeCoincidentPlanNodes,
  setPlanWallThickness,
  setPlanWallHeight,
  splitPlanWall,
  splitPlanWallResult,
} from "./wallEditing";
import type { InteriorProject, WallEntity } from "./types";

function adjacentBoxProject(): InteriorProject {
  const wall = (id: string, roomId: string, start: [number, number], end: [number, number]): WallEntity => ({
    id, roomId, start: { x: start[0], z: start[1] }, end: { x: end[0], z: end[1] },
    heightMm: 2800, thicknessMm: 120, visible: true, materialId: null,
  });
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
  };
}

describe("D3 wall editing domain", () => {
  it("creates a snapped interior wall segment with graph nodes", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const { project, wallId } = createWallSegmentResult(base, {
      start: { x: 0, z: -800 },
      end: { x: 0, z: 800 },
    });
    expect(wallId).toBeTruthy();
    expect(project.walls).toHaveLength(base.walls.length + 1);
    expect(project.nodes.length).toBeGreaterThanOrEqual(base.nodes.length);
    expect(validateInteriorProject(project).issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("reuses a shared edge and restores opposite loop directions", () => {
    const migrated = migrateBoxRoomsToWallGraph(adjacentBoxProject());
    const detached = {
      ...migrated,
      activeRoomId: "room-right",
      loops: migrated.loops.map((loop) => loop.id === "room-right:outer-loop"
        ? { ...loop, wallUses: loop.wallUses.filter((use) => use.wallId !== "left-shared") }
        : loop),
    };
    const before = detached.walls.length;
    const next = createWallSegment(detached, {
      roomId: "room-right",
      start: { x: 3000, z: 3000 },
      end: { x: 3000, z: 0 },
    });
    expect(next.walls).toHaveLength(before);
    expect(roomIdsUsingWall(next, "left-shared")).toEqual(["room-left", "room-right"]);
    expect(next.walls.find((wall) => wall.id === "left-shared")?.roomId).toBeNull();
    const directions = next.loops.map((loop) => loop.wallUses.find((use) => use.wallId === "left-shared")?.direction);
    expect(new Set(directions)).toEqual(new Set(["forward", "reverse"]));
  });

  it("splits a wall and preserves loop contiguity", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const wallId = base.loops[0]!.wallUses[0]!.wallId;
    const split = splitPlanWall(base, wallId);
    expect(split.walls.length).toBe(base.walls.length + 1);
    expect(split.loops[0]?.wallUses.some((use) => use.wallId === wallId)).toBe(false);
    expect(split.loops[0]?.wallUses.length).toBe(5);
  });

  it("returns new segment ids from splitPlanWallResult", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const wallId = base.walls[0]!.id;
    const { project, firstWallId, secondWallId } = splitPlanWallResult(base, wallId);
    expect(firstWallId).not.toBe(wallId);
    expect(secondWallId).not.toBe(wallId);
    expect(project.walls.some((wall) => wall.id === wallId)).toBe(false);
    expect(project.walls.some((wall) => wall.id === firstWallId)).toBe(true);
    expect(project.walls.some((wall) => wall.id === secondWallId)).toBe(true);
  });

  it("splits spanning openings across both wall segments", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const wall = base.walls[0]!;
    const withOpening = {
      ...base,
      openings: [{
        id: "span-door", wallId: wall.id, kind: "door" as const,
        offsetMm: 800, widthMm: 1800, heightMm: 2100, sillHeightMm: 0,
      }],
    };
    const split = splitPlanWallResult(withOpening, wall.id, 1500);
    expect(split.project.openings).toHaveLength(2);
    expect(split.project.openings.every((opening) => [split.firstWallId, split.secondWallId].includes(opening.wallId))).toBe(true);
    expect(split.project.openings.reduce((sum, opening) => sum + opening.widthMm, 0)).toBe(1800);
  });

  it("updates thickness and compiles the edited wall graph", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const wallId = base.walls[0]!.id;
    const edited = setPlanWallThickness(base, wallId, 180);
    expect(edited.walls.find((wall) => wall.id === wallId)?.thicknessMm).toBe(180);
    const scene = compileLivingRoomScene(edited);
    expect(scene.nodes.some((node) => node.metadata?.wallId === wallId)).toBe(true);
  });

  it("updates a wall height without changing its plan endpoints", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const wall = base.walls[0]!;
    const next = setPlanWallHeight(base, wall.id, 3200);
    expect(next.walls.find((item) => item.id === wall.id)).toMatchObject({
      heightMm: 3200, start: wall.start, end: wall.end,
    });
  });

  it("joins coincident nodes after multi-room authoring", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const withRoom = drawRoomFromPoints(base, {
      kind: "rectangle",
      points: rectanglePoints({ x: 4000, z: 0 }, { x: 6200, z: 2200 }),
    });
    const duplicate = {
      ...withRoom,
      nodes: [...withRoom.nodes, { id: "node-dup", position: { ...withRoom.nodes[0]!.position } }],
    };
    const joined = mergeCoincidentPlanNodes(duplicate);
    expect(joined.nodes.length).toBeLessThan(duplicate.nodes.length);
  });

  it("refuses to collapse incompatible walls during node join", () => {
    const base = createEmptyInteriorProject({ id: "join-test", name: "Join test", now: "2026-08-27T00:00:00.000Z" });
    const project: InteriorProject = {
      ...base,
      nodes: [
        { id: "node-a", position: { x: 0, z: 0 } },
        { id: "node-b", position: { x: 0, z: 0 } },
        { id: "node-c", position: { x: 1000, z: 0 } },
      ],
      walls: [
        {
          id: "wall-thin", roomId: null, start: { x: 0, z: 0 }, end: { x: 1000, z: 0 },
          startNodeId: "node-a", endNodeId: "node-c", heightMm: 2800, thicknessMm: 120, visible: true, materialId: null,
        },
        {
          id: "wall-thick", roomId: null, start: { x: 0, z: 0 }, end: { x: 1000, z: 0 },
          startNodeId: "node-b", endNodeId: "node-c", heightMm: 2800, thicknessMm: 240, visible: true, materialId: null,
        },
      ],
    };
    const joined = joinPlanNodes(project, "node-a", "node-b");
    expect(joined.walls.some((wall) => wall.id === "wall-thin")).toBe(true);
    expect(joined.walls.some((wall) => wall.id === "wall-thick")).toBe(true);
    expect(joined.walls.filter((wall) =>
      (wall.startNodeId === "node-a" && wall.endNodeId === "node-c")
      || (wall.endNodeId === "node-a" && wall.startNodeId === "node-c"),
    )).toHaveLength(2);
  });

  it("deletes an interior segment without breaking the outer loop", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const withSegment = createWallSegment(base, { start: { x: 0, z: -500 }, end: { x: 0, z: 500 } });
    const interior = withSegment.walls.at(-1)!;
    const deleted = deletePlanWall(withSegment, interior.id);
    expect(deleted.walls).toHaveLength(withSegment.walls.length - 1);
    expect(deleted.loops[0]?.wallUses.length).toBe(base.loops[0]?.wallUses.length);
  });

  it("joins two explicit node ids and removes duplicate edges", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const [a] = base.nodes;
    if (!a) throw new Error("missing nodes");
    const shifted = {
      ...base,
      nodes: [...base.nodes, { id: "node-shift", position: { ...a.position } }],
    };
    const joined = joinPlanNodes(shifted, a.id, "node-shift");
    expect(joined.nodes.some((node) => node.id === "node-shift")).toBe(false);
  });
});
