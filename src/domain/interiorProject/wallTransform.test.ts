import { describe, expect, it } from "vitest";
import { applyPlannerStarterTemplate } from "../livingRoom/plannerStarters";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { drawRoomFromPoints, rectanglePoints } from "./roomDrawing";
import { wallLengthMm } from "./planTopology";
import { offsetPlanWall } from "./wallOffset";
import {
  applyWallPlanPatch,
  setPlanWallAngle,
  setPlanWallLength,
  wallPlanAngleDeg,
  wallPlanMidpoint,
} from "./wallTransform";

function drawnRectangle() {
  const blank = applyPlannerStarterTemplate(
    createLivingRoomStarterProject({ now: "2026-08-31T00:00:00.000Z" }),
    "blank-room",
  );
  return drawRoomFromPoints(blank, {
    kind: "rectangle",
    points: rectanglePoints({ x: 0, z: 0 }, { x: 4000, z: 3000 }),
  });
}

function axisWall(project: ReturnType<typeof drawnRectangle>) {
  return project.walls.find((item) => Math.abs(item.end.z - item.start.z) < 1 && item.end.x > item.start.x)!;
}

describe("wall plan transform", () => {
  it("sets length by moving the end node without rewriting the wall graph", () => {
    const project = drawnRectangle();
    const wall = axisWall(project);
    const next = setPlanWallLength(project, wall.id, 3500);
    const updated = next.walls.find((item) => item.id === wall.id)!;
    expect(wallLengthMm(updated)).toBeCloseTo(3500, 0);
    expect(updated.start).toEqual(wall.start);
    expect(next.nodes.length).toBe(project.nodes.length);
  });

  it("sets angle on a partition without rewriting movePlanNode", () => {
    const project = drawnRectangle();
    const offset = offsetPlanWall(project, axisWall(project).id, 400);
    const partition = offset.walls.find((wall) => !project.walls.some((item) => item.id === wall.id))!;
    const next = setPlanWallAngle(offset, partition.id, 45);
    const updated = next.walls.find((item) => item.id === partition.id)!;
    expect(wallPlanAngleDeg(updated)).toBe(45);
    expect(wallLengthMm(updated)).toBeCloseTo(wallLengthMm(partition), 0);
  });

  it("keeps end fixed when length anchor is end", () => {
    const project = drawnRectangle();
    const wall = axisWall(project);
    const next = setPlanWallLength(project, wall.id, 3200, "end");
    const updated = next.walls.find((item) => item.id === wall.id)!;
    expect(wallLengthMm(updated)).toBeCloseTo(3200, 0);
    expect(updated.end).toEqual(wall.end);
  });

  it("translates a wall from midpoint fields", () => {
    const project = drawnRectangle();
    const wall = axisWall(project);
    const mid = wallPlanMidpoint(wall);
    const next = applyWallPlanPatch(project, wall.id, { zMm: mid.z + 200 });
    const updated = next.walls.find((item) => item.id === wall.id)!;
    expect(wallPlanMidpoint(updated).z).toBeCloseTo(mid.z + 200, 0);
    expect(wallLengthMm(updated)).toBeCloseTo(wallLengthMm(wall), 0);
  });
});
