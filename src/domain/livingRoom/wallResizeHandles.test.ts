import { describe, expect, it } from "vitest";
import { polygonCentroid, roomPlanPolygon } from "../interiorProject";
import { createLivingRoomStarterProject } from "./preset";
import { wallResizeHandleSpecs } from "./wallResizeHandles";

describe("wallResizeHandleSpecs", () => {
  it("gives every outer wall an outward normal that points away from the room", () => {
    const project = createLivingRoomStarterProject({ now: "2026-10-09T09:00:00.000Z" });
    const specs = wallResizeHandleSpecs(project);
    expect(specs.length).toBeGreaterThanOrEqual(4);
    const centroid = polygonCentroid(roomPlanPolygon(project, project.activeRoomId)!.outer);
    for (const spec of specs) {
      const mid = { x: (spec.start.x + spec.end.x) / 2, z: (spec.start.z + spec.end.z) / 2 };
      const dot = (mid.x - centroid.x) * spec.outward.x + (mid.z - centroid.z) * spec.outward.z;
      expect(dot).toBeGreaterThan(0);
      expect(Math.hypot(spec.outward.x, spec.outward.z)).toBeCloseTo(1, 6);
    }
  });

  it("gives nothing when the walls are only a plan trace", () => {
    const project = createLivingRoomStarterProject({ now: "2026-10-09T09:00:00.000Z" });
    const lowered = { ...project, walls: project.walls.map((wall) => ({ ...wall, raised: false })) };
    expect(wallResizeHandleSpecs(lowered)).toEqual([]);
  });
});
