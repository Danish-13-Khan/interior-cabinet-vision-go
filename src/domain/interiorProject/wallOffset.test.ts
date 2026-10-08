import { describe, expect, it } from "vitest";
import { applyPlannerStarterTemplate } from "../livingRoom/plannerStarters";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { drawRoomFromPoints, rectanglePoints } from "./roomDrawing";
import { createWallGraphIndex } from "./wallGraph";
import { offsetPlanWall } from "./wallOffset";
import { setPlanWallsRaised } from "./wallRaise";

describe("wall offset", () => {
  it("adds a parallel partition joined to the side walls without moving the source wall", () => {
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
    // The partition's ends sit on the two side walls, which split there (T-junctions): +1 partition, +2 halves.
    expect(offset.walls.length).toBe(raised.walls.length + 3);
    const added = offset.walls.find((wall) => wall.extensions?.isPartition)!;
    expect(added).toBeTruthy();
    const index = createWallGraphIndex(offset);
    expect(index.incidentWallIdsByNode.get(added.startNodeId!)).toHaveLength(3);
    expect(index.incidentWallIdsByNode.get(added.endNodeId!)).toHaveLength(3);
    expect(offset.rooms).toHaveLength(raised.rooms.length);
    const sourceAfter = offset.walls.find((wall) => wall.id === source.id)!;
    expect(sourceAfter.start).toEqual(source.start);
    expect(sourceAfter.end).toEqual(source.end);
    const sourceMid = { x: (source.start.x + source.end.x) / 2, z: (source.start.z + source.end.z) / 2 };
    const addedMid = { x: (added.start.x + added.end.x) / 2, z: (added.start.z + added.end.z) / 2 };
    expect(Math.hypot(addedMid.x - sourceMid.x, addedMid.z - sourceMid.z)).toBeCloseTo(400, 5);
    expect(added.thicknessMm).toBe(source.thicknessMm);
    expect(added.heightMm).toBe(source.heightMm);
    expect(added.materialId).toBe(source.materialId);
    expect(added.raised).toBe(true);
  });
});
