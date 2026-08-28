import { describe, expect, it } from "vitest";
import { drawRoomFromPoints, movePlanNodeWithOpenings } from "../interiorProject";
import { createLivingRoomObject } from "./catalog";
import { listRoomWallCorners, placeCornerCabinet, preferredRoomWallCorner, reflowCornerCabinetsForWalls } from "./cornerPlacement";
import { createLivingRoomStarterProject } from "./preset";

describe("I2 corner placement", () => {
  it("finds interior corners on an irregular room loop", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const project = drawRoomFromPoints(starter, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 3200, z: 800 }, { x: 2700, z: 3000 }, { x: -500, z: 2200 }],
    });
    const corners = listRoomWallCorners(project, project.activeRoomId);
    expect(corners.length).toBeGreaterThan(0);
    expect(corners.some((corner) => corner.angleDeg > 35 && corner.angleDeg < 175)).toBe(true);
  });

  it("places a corner wardrobe against the preferred room junction", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const project = drawRoomFromPoints(starter, {
      kind: "polygon",
      points: [{ x: 0, z: 0 }, { x: 3000, z: 0 }, { x: 3000, z: 2400 }, { x: 0, z: 2400 }],
    });
    const corner = preferredRoomWallCorner(project, project.activeRoomId);
    expect(corner).toBeTruthy();
    const draft = createLivingRoomObject("living:corner-wardrobe", {
      id: "corner-1",
      roomId: project.activeRoomId,
      position: { x: 0, y: 0, z: 0 },
    });
    const placed = placeCornerCabinet(project, draft, corner!);
    expect(placed.extensions?.cornerPlacement?.nodeId).toBe(corner!.nodeId);
    expect(placed.rotation.y).toBe(corner!.rotationY);
    expect(Math.hypot(placed.position.x - corner!.position.x, placed.position.z - corner!.position.z)).toBeGreaterThan(100);
  });

  it("reflows a corner wardrobe when one of its junction walls changes", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const project = drawRoomFromPoints(source, { kind: "polygon", points: [
      { x: 0, z: 0 }, { x: 3000, z: 0 }, { x: 3000, z: 2400 }, { x: 0, z: 2400 },
    ] });
    const corner = preferredRoomWallCorner(project, project.activeRoomId)!;
    const cabinet = placeCornerCabinet(project, createLivingRoomObject("living:corner-wardrobe", {
      id: "corner-1", roomId: project.activeRoomId, position: { x: 0, y: 0, z: 0 },
    }), corner);
    const placed = { ...project, objects: [cabinet] };
    const node = placed.nodes.find((item) => item.id === corner.nodeId)!;
    const moved = movePlanNodeWithOpenings(placed, corner.nodeId, { x: node.position.x + 150, z: node.position.z });
    const reflowed = reflowCornerCabinetsForWalls(moved, corner.wallIds);
    expect(reflowed.objects[0]!.position).not.toEqual(cabinet.position);
  });
});
