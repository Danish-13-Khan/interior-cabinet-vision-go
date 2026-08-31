import { describe, expect, it } from "vitest";
import { applyPlannerStarterTemplate } from "../livingRoom/plannerStarters";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { drawRoomFromPoints, rectanglePoints } from "./roomDrawing";
import { offsetPlanWall } from "./wallOffset";
import { setPlanWallsRaised } from "./wallRaise";

describe("wall offset", () => {
  it("adds a parallel partition without moving the source wall", () => {
    const blank = applyPlannerStarterTemplate(
      createLivingRoomStarterProject({ now: "2026-08-31T00:00:00.000Z" }),
      "blank-room",
    );
    const drawn = drawRoomFromPoints(blank, {
      kind: "rectangle",
      points: rectanglePoints({ x: 0, z: 0 }, { x: 4000, z: 3000 }),
    });
    const raised = setPlanWallsRaised(drawn, drawn.walls.map((wall) => wall.id), true);
    const source = raised.walls[0]!;
    const offset = offsetPlanWall(raised, source.id, 400);
    expect(offset.walls.length).toBe(raised.walls.length + 1);
    const added = offset.walls.find((wall) => !raised.walls.some((item) => item.id === wall.id))!;
    expect(added.extensions?.isPartition).toBe(true);
    const sourceAfter = offset.walls.find((wall) => wall.id === source.id)!;
    expect(sourceAfter.start).toEqual(source.start);
    expect(sourceAfter.end).toEqual(source.end);
    const sourceMid = { x: (source.start.x + source.end.x) / 2, z: (source.start.z + source.end.z) / 2 };
    const addedMid = { x: (added.start.x + added.end.x) / 2, z: (added.start.z + added.end.z) / 2 };
    expect(Math.hypot(addedMid.x - sourceMid.x, addedMid.z - sourceMid.z)).toBeCloseTo(400, 5);
  });
});
