import { describe, expect, it } from "vitest";
import { orientWallForRoom } from "../interiorProject";
import { createLivingRoomStarterProject } from "./preset";
import { snapCabinetToWall, snapCabinetToWallWithSnap } from "./wardrobePlacement";
import { wallOffsetOf } from "./wallOffsetSnap";

const NOW = "2026-10-08T00:00:00.000Z";

/** The starter room is 6200 wide; its back wall runs along z = −2300. */
function fixture() {
  const project = createLivingRoomStarterProject({ now: NOW });
  const template = project.objects.find((object) => object.kind === "cabinet") ?? project.objects[0]!;
  const base = {
    ...template, id: "base-600", kind: "cabinet" as const, category: "cabinet", name: "base 600",
    position: { x: 0, y: 0, z: -2000 }, rotation: { x: 0, y: 0, z: 0 },
    dimensions: { widthMm: 600, heightMm: 720, depthMm: 560 },
    extensions: {},
  };
  const backWall = project.walls.find((wall) => wall.extensions?.wallSide === "back")!;
  return { project: { ...project, objects: [base] }, base, backWall };
}

describe("cabinet along-wall snapping (Phase 4)", () => {
  it("centres a 600 base on the wall midpoint and names it", () => {
    const { project, base, backWall } = fixture();
    const oriented = orientWallForRoom(project, base.roomId, backWall);
    const { object, snap } = snapCabinetToWallWithSnap(project, base, { x: 30, y: 0, z: -2000 }, { thresholdMm: 40 });
    expect(object.extensions?.wallAttachment).toEqual({ wallId: backWall.id });
    expect(wallOffsetOf(oriented, { x: object.position.x, z: object.position.z })).toBeCloseTo(3100, 6);
    expect(wallOffsetOf(oriented, { x: object.position.x, z: object.position.z }) - 300).toBeCloseTo(2800, 6);
    expect(snap?.candidate?.label).toBe("Wall midpoint");
    expect(snap?.point.x).toBeCloseTo(0, 6);
  });

  it("keeps the pointer's offset when nothing is within the radius", () => {
    const { project, base } = fixture();
    const { object, snap } = snapCabinetToWallWithSnap(project, base, { x: 480, y: 0, z: -2000 }, { thresholdMm: 40 });
    expect(object.position.x).toBeCloseTo(480, 6);
    expect(snap).toBeNull();
  });

  it("abuts a neighbour cabinet on the same wall", () => {
    const { project, base, backWall } = fixture();
    const attached = snapCabinetToWall(project, base, { x: 0, y: 0, z: -2000 });
    const neighbour = { ...base, id: "base-900", dimensions: { ...base.dimensions, widthMm: 900 }, extensions: {} };
    const withBoth = { ...project, objects: [attached, neighbour] };
    // Attached cabinet spans x −300…300; a 900 wide neighbour whose left edge is near 300 snaps to it.
    const { object, snap } = snapCabinetToWallWithSnap(withBoth, neighbour, { x: 300 + 450 + 25, y: 0, z: -2000 }, { thresholdMm: 40 });
    expect(object.position.x).toBeCloseTo(750, 6);
    expect(snap?.candidate?.label).toBe("Cabinet edge");
    expect(snap?.candidate?.sourceId).toBe(attached.id);
    expect(attached.extensions?.wallAttachment).toEqual({ wallId: backWall.id });
  });

  it("a zero radius turns the along-wall targets off but keeps the wall-flush snap", () => {
    const { project, base, backWall } = fixture();
    const { object, snap } = snapCabinetToWallWithSnap(project, base, { x: 30, y: 0, z: -2000 }, { thresholdMm: 0 });
    expect(object.position.x).toBeCloseTo(30, 6);
    expect(object.extensions?.wallAttachment).toEqual({ wallId: backWall.id });
    expect(snap).toBeNull();
  });
});
