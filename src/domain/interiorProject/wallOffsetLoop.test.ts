import { describe, expect, it } from "vitest";
import { applyPlannerStarterTemplate } from "../livingRoom/plannerStarters";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { drawRoomFromPoints, rectanglePoints } from "./roomDrawing";
import { offsetPlanLoop } from "./wallOffsetLoop";

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

describe("offsetPlanLoop", () => {
  it("adds inward partition walls without moving the outer loop", () => {
    const project = drawnRectangle();
    const next = offsetPlanLoop(project, project.activeRoomId, 400);
    expect(next.walls.length).toBe(project.walls.length + 4);
    for (const wall of project.walls) {
      const after = next.walls.find((item) => item.id === wall.id)!;
      expect(after.start).toEqual(wall.start);
      expect(after.end).toEqual(wall.end);
    }
    const added = next.walls.filter((wall) => !project.walls.some((item) => item.id === wall.id));
    expect(added.every((wall) => wall.extensions?.isPartition === true)).toBe(true);
  });

  it("leaves the graph unchanged when the inset would collapse", () => {
    const project = drawnRectangle();
    expect(offsetPlanLoop(project, project.activeRoomId, 2000)).toBe(project);
  });
});
