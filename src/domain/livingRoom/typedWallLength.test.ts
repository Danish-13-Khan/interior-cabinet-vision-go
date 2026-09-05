import { describe, expect, it } from "vitest";
import { applyPlannerStarterTemplate } from "./plannerStarters";
import { createLivingRoomStarterProject } from "./preset";
import { drawRoomFromPoints, rectanglePoints } from "../interiorProject/roomDrawing";
import { wallLengthMm } from "../interiorProject";
import { setTypedWallLength, wallLengthAnchorLabel } from "./typedWallLength";

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

describe("typedWallLength", () => {
  it("documents start-anchor UX", () => {
    expect(wallLengthAnchorLabel("start")).toMatch(/start fixed/i);
  });

  it("keeps start fixed and moves end when anchored at start", () => {
    const project = drawnRectangle();
    const wall = axisWall(project);
    const next = setTypedWallLength(project, wall.id, 4275, "start");
    const updated = next.walls.find((item) => item.id === wall.id)!;
    expect(wallLengthMm(updated)).toBeCloseTo(4275, 0);
    expect(updated.start).toEqual(wall.start);
    expect(updated.end.x).not.toBeCloseTo(wall.end.x, 0);
  });

  it("keeps end fixed and moves start when anchored at end", () => {
    const project = drawnRectangle();
    const wall = axisWall(project);
    const next = setTypedWallLength(project, wall.id, 3500, "end");
    const updated = next.walls.find((item) => item.id === wall.id)!;
    expect(wallLengthMm(updated)).toBeCloseTo(3500, 0);
    expect(updated.end).toEqual(wall.end);
    expect(updated.start.x).not.toBeCloseTo(wall.start.x, 0);
  });
});
