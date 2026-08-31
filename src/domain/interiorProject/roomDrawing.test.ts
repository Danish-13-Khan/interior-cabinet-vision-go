import { describe, expect, it } from "vitest";
import { applyPlannerStarterTemplate } from "../livingRoom/plannerStarters";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { compileLivingRoomScene } from "../livingRoom/sceneCompiler";
import { roomIdsUsingWall, selectWallsForRoom } from "./planTopology";
import { drawRoomFromPoints, normalizeRoomPolygon, rectanglePoints } from "./roomDrawing";
import { centerPolygonAtOrigin, roomPlanViewBounds } from "./roomPlanBounds";
import { validateInteriorProject } from "./validation";
import type { WallEntity } from "./types";

function wallExtents(walls: WallEntity[]) {
  const xs = walls.flatMap((wall) => [wall.start.x, wall.end.x]);
  const zs = walls.flatMap((wall) => [wall.start.z, wall.end.z]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  };
}

describe("D2 room drawing domain", () => {
  it("normalizes a closed polygon to the required winding", () => {
    expect(normalizeRoomPolygon([{ x: 0, z: 0 }, { x: 0, z: 2000 }, { x: 3000, z: 0 }, { x: 0, z: 0 }]))
      .toEqual([{ x: 3000, z: 0 }, { x: 0, z: 2000 }, { x: 0, z: 0 }]);
    expect(normalizeRoomPolygon([{ x: 0, z: 0 }, { x: 1, z: 1 }])).toBeNull();
  });

  it("centers drawn polygons on the room origin", () => {
    const centered = centerPolygonAtOrigin(rectanglePoints({ x: 7000, z: 0 }, { x: 10000, z: 2400 }));
    expect(centered).toEqual([
      { x: -1500, z: -1200 },
      { x: 1500, z: -1200 },
      { x: 1500, z: 1200 },
      { x: -1500, z: 1200 },
    ]);
  });

  it("adds a click-drag rectangle as a centered graph room with a closed loop", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const project = drawRoomFromPoints(base, { kind: "rectangle", points: rectanglePoints({ x: 7000, z: 0 }, { x: 10000, z: 2400 }) });
    const room = project.rooms.at(-1)!;
    const walls = selectWallsForRoom(project, room.id);
    const extents = wallExtents(walls);
    expect(room.dimensions).toMatchObject({ widthMm: 3000, depthMm: 2400 });
    expect(extents.minX).toBe(-1500);
    expect(extents.maxX).toBe(1500);
    expect(extents.minZ).toBe(-1200);
    expect(extents.maxZ).toBe(1200);
    expect(project.loops.find((loop) => loop.id === room.outerLoopId)?.wallUses).toHaveLength(4);
    expect(validateInteriorProject(project).issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(roomPlanViewBounds(project, room.id)).toMatchObject({
      minX: -1500,
      maxX: 1500,
      minZ: -1200,
      maxZ: 1200,
      centerX: 0,
      centerZ: 0,
    });
  });

  it("adds a polygon room without changing existing graph ownership", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const firstWall = base.walls[0]!;
    const project = drawRoomFromPoints(base, {
      kind: "polygon",
      points: [{ x: 7000, z: 0 }, { x: 9000, z: 0 }, { x: 9500, z: 1800 }, { x: 7600, z: 2600 }, { x: 7000, z: 1300 }],
    });
    expect(project.rooms).toHaveLength(base.rooms.length + 1);
    expect(project.walls).toHaveLength(base.walls.length + 5);
    expect(roomIdsUsingWall(project, firstWall.id)).toEqual([base.activeRoomId]);
  });

  it("compiles drawn room walls into the 3D scene", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const project = drawRoomFromPoints(base, {
      kind: "polygon",
      points: [{ x: 8000, z: 500 }, { x: 9500, z: 500 }, { x: 9200, z: 1800 }, { x: 7800, z: 1600 }],
    });
    const scene = compileLivingRoomScene(project);
    const wallNodes = scene.nodes.filter((node) => node.metadata?.role === "wall");
    expect(wallNodes.length).toBeGreaterThanOrEqual(4);
  });

  it("draws a hollow rectangular room on a blank site with named wall sides", () => {
    const blank = applyPlannerStarterTemplate(
      createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" }),
      "blank-room",
    );
    const project = drawRoomFromPoints(blank, {
      kind: "rectangle",
      points: rectanglePoints({ x: 0, z: 0 }, { x: 4000, z: 3000 }),
    });
    expect(project.rooms).toHaveLength(1);
    expect(project.rooms[0]?.name).toBe("Room 1");
    expect(project.walls.every((wall) => wall.raised === false)).toBe(true);
    const scene = compileLivingRoomScene(project);
    const sides = new Set(
      scene.nodes.filter((node) => node.metadata?.role === "wall").map((node) => String(node.metadata.wallSide)),
    );
    expect([...sides].sort()).toEqual(["back", "front", "left", "right"]);
    const floor = scene.nodes.find((node) => node.metadata?.role === "floor");
    expect(floor?.primitives[0]?.kind === "polygon-prism" ? floor.primitives[0].heightMm : 0).toBe(12);
  });

  it("leaves the source project untouched for undo restore", () => {
    const base = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const roomCount = base.rooms.length;
    const wallCount = base.walls.length;
    drawRoomFromPoints(base, { kind: "rectangle", points: rectanglePoints({ x: 2000, z: 500 }, { x: 3500, z: 2000 }) });
    expect(base.rooms).toHaveLength(roomCount);
    expect(base.walls).toHaveLength(wallCount);
  });
});
