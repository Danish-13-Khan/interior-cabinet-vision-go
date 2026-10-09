import { describe, expect, it } from "vitest";
import { createEmptyInteriorProject } from "../interiorProject/defaults";
import { drawRoomFromPoints } from "../interiorProject/roomDrawing";
import { pointInPolygon, polygonSignedArea, roomPlanPolygon } from "../interiorProject";
import { createWallSegmentResult } from "../interiorProject";
import { createLivingRoomStarterProject } from "./preset";
import { wallResizeHandleSpecs } from "./wallResizeHandles";

const NOW = "2026-10-09T09:00:00.000Z";

function expectOutwardLeavesRoom(project: ReturnType<typeof createLivingRoomStarterProject>) {
  const outline = roomPlanPolygon(project, project.activeRoomId)!.outer;
  const specs = wallResizeHandleSpecs(project).filter((spec) => spec.onLoop);
  expect(specs.length).toBeGreaterThanOrEqual(4);
  for (const spec of specs) {
    const mid = { x: (spec.start.x + spec.end.x) / 2, z: (spec.start.z + spec.end.z) / 2 };
    const outside = { x: mid.x + spec.outward!.x * 150, z: mid.z + spec.outward!.z * 150 };
    const inside = { x: mid.x - spec.outward!.x * 150, z: mid.z - spec.outward!.z * 150 };
    expect(pointInPolygon(outside, outline)).toBe(false);
    expect(pointInPolygon(inside, outline)).toBe(true);
    expect(Math.hypot(spec.outward!.x, spec.outward!.z)).toBeCloseTo(1, 6);
  }
}

describe("wallResizeHandleSpecs", () => {
  it("points every outer wall's normal out of a rectangular room", () => {
    expectOutwardLeavesRoom(createLivingRoomStarterProject({ now: NOW }));
  });

  it("points the normals out of an L-shaped room too, including the walls at the inner corner", () => {
    const project = drawRoomFromPoints(createEmptyInteriorProject({ now: NOW }), { kind: "polygon", points: [
      { x: 0, z: 0 }, { x: 4000, z: 0 }, { x: 4000, z: 1500 }, { x: 1500, z: 1500 }, { x: 1500, z: 4000 }, { x: 0, z: 4000 },
    ] }, { raised: true });
    expectOutwardLeavesRoom(project as ReturnType<typeof createLivingRoomStarterProject>);
    expect(wallResizeHandleSpecs(project).filter((spec) => spec.onLoop)).toHaveLength(6);
  });

  it("still points outward when the loop runs clockwise", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const room = project.rooms.find((item) => item.id === project.activeRoomId)!;
    // Walk the outer loop the other way: reversed use order, every direction flipped.
    const loops = project.loops.map((loop) => (loop.id === room.outerLoopId
      ? { ...loop, wallUses: [...loop.wallUses].reverse().map((use) => ({
        ...use, direction: use.direction === "forward" ? "reverse" as const : "forward" as const,
      })) }
      : loop));
    const clockwise = { ...project, loops };
    const area = polygonSignedArea(roomPlanPolygon(clockwise, room.id)!.outer);
    expect(Math.sign(area)).toBe(-Math.sign(polygonSignedArea(roomPlanPolygon(project, room.id)!.outer)));
    expectOutwardLeavesRoom(clockwise);
  });

  it("gives a partition end knobs, not a face plate", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const withPartition = createWallSegmentResult(project, {
      start: { x: 0, z: -800 }, end: { x: 0, z: 800 }, kind: "partition", raised: true,
    }).project;
    const partition = wallResizeHandleSpecs(withPartition).find((spec) => !spec.onLoop);
    expect(partition).toBeTruthy();
    expect(partition!.outward).toBeNull();
    expect(partition!.label).toBe("partition");
  });

  it("gives nothing when the walls are only a plan trace", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const lowered = { ...project, walls: project.walls.map((wall) => ({ ...wall, raised: false })) };
    expect(wallResizeHandleSpecs(lowered)).toEqual([]);
  });
});
