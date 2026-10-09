import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../livingRoom";
import { polygonBounds, roomPlanPolygon } from "./roomGeometry";
import { resizeRoomPlanGeometry } from "./roomResize";

const NOW = "2026-10-09T09:00:00.000Z";

function bounds(project: ReturnType<typeof createLivingRoomStarterProject>) {
  return polygonBounds(roomPlanPolygon(project, project.activeRoomId)!.outer);
}

describe("room resize anchors", () => {
  it("keeps the left wall when the width anchor is min, and the right wall when it is max", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const room = project.rooms.find((item) => item.id === project.activeRoomId)!;
    const before = bounds(project);
    const wider = { ...room.dimensions, widthMm: room.dimensions.widthMm + 800 };
    const keepLeft = bounds(resizeRoomPlanGeometry(project, room.id, wider, { x: "min" }));
    expect(keepLeft.minX).toBeCloseTo(before.minX, 3);
    expect(keepLeft.maxX).toBeCloseTo(before.maxX + 800, 3);
    const keepRight = bounds(resizeRoomPlanGeometry(project, room.id, wider, { x: "max" }));
    expect(keepRight.maxX).toBeCloseTo(before.maxX, 3);
    expect(keepRight.minX).toBeCloseTo(before.minX - 800, 3);
    const centred = bounds(resizeRoomPlanGeometry(project, room.id, wider));
    expect(centred.minX).toBeCloseTo(before.minX - 400, 3);
    expect(centred.maxX).toBeCloseTo(before.maxX + 400, 3);
  });

  it("keeps openings inside the walls that changed length", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const room = project.rooms.find((item) => item.id === project.activeRoomId)!;
    const narrower = { ...room.dimensions, widthMm: Math.max(2500, room.dimensions.widthMm - 1200) };
    const next = resizeRoomPlanGeometry(project, room.id, narrower, { x: "min", z: "max" });
    for (const opening of next.openings) {
      const wall = next.walls.find((item) => item.id === opening.wallId)!;
      const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
      expect(opening.offsetMm).toBeGreaterThanOrEqual(0);
      expect(opening.offsetMm + opening.widthMm).toBeLessThanOrEqual(length + 0.001);
    }
  });
});
