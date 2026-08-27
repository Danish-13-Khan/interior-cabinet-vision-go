import { describe, expect, it } from "vitest";
import { compileLivingRoomScene } from "../livingRoom/sceneCompiler";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { pointInPolygon, roomPlanPolygon } from "./roomGeometry";
import { roomIdsUsingWall } from "./planTopology";
import { setActiveInteriorRoom } from "./roomActivation";
import { createWallSegment } from "./wallEditing";
import { validateInteriorProject } from "./validation";
import type { InteriorObjectEntity, InteriorProject } from "./types";

function splitVertically(project: InteriorProject) {
  return createWallSegment(project, {
    start: { x: 0, z: -2300 }, end: { x: 0, z: 2300 }, kind: "wall",
  });
}

function withObject(project: InteriorProject, position: { x: number; z: number }): InteriorProject {
  const object: InteriorObjectEntity = {
    id: "split-object",
    roomId: project.activeRoomId,
    name: "Split object",
    kind: "furniture",
    category: "test",
    catalogItemId: "test:object",
    position: { x: position.x, y: 0, z: position.z },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { widthMm: 600, heightMm: 400, depthMm: 400 },
    materialSlots: {},
    parameters: {},
  };
  return { ...project, objects: [...project.objects, object] };
}

describe("H1 room-split Draw Wall", () => {
  it("splits a closed room across mid-wall endpoints and regenerates both face surfaces", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const originalRoomId = source.activeRoomId;
    const next = splitVertically(source);
    const createdRoom = next.rooms.find((room) => room.id !== originalRoomId)!;
    const splitWall = next.walls.find((wall) => wall.extensions?.structuralKind === "room-split")!;

    expect(next.rooms).toHaveLength(source.rooms.length + 1);
    expect(roomIdsUsingWall(next, splitWall.id).sort()).toEqual([originalRoomId, createdRoom.id].sort());
    expect(next.surfaces.filter((surface) => surface.kind === "floor" && [originalRoomId, createdRoom.id].includes(String(surface.roomId)))).toHaveLength(2);
    expect(next.surfaces.filter((surface) => surface.kind === "ceiling" && [originalRoomId, createdRoom.id].includes(String(surface.roomId)))).toHaveLength(2);
    expect(validateInteriorProject(next).issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(compileLivingRoomScene(next).nodes.filter((node) => node.metadata?.role === "floor")).toHaveLength(1);
    expect(compileLivingRoomScene(setActiveInteriorRoom(next, createdRoom.id)).nodes.filter((node) => node.metadata?.role === "floor")).toHaveLength(1);
    expect(source.rooms).toHaveLength(1);
  });

  it("keeps a partition draw as a non-splitting wall", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const next = createWallSegment(source, {
      start: { x: 0, z: -2300 }, end: { x: 0, z: 2300 }, kind: "partition",
    });
    expect(next.rooms).toHaveLength(source.rooms.length);
  });

  it("splits corner-to-corner without validation errors", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const next = createWallSegment(source, {
      start: { x: -3100, z: -2300 }, end: { x: 3100, z: 2300 }, kind: "wall",
    });
    expect(next.rooms).toHaveLength(2);
    expect(validateInteriorProject(next).issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("remaps objects, lights, and cameras into the face that contains them", () => {
    const source = withObject(createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" }), { x: 1500, z: 0 });
    const originalRoomId = source.activeRoomId;
    const next = splitVertically(source);
    const createdRoom = next.rooms.find((room) => room.id !== originalRoomId)!;
    const createdPolygon = roomPlanPolygon(next, createdRoom.id)?.outer ?? [];
    const expectedRoom = (point: { x: number; z: number }) =>
      pointInPolygon(point, createdPolygon) ? createdRoom.id : originalRoomId;

    expect(next.objects.find((item) => item.id === "split-object")?.roomId).toBe(expectedRoom({ x: 1500, z: 0 }));
    for (const light of next.lights) {
      if (light.roomId !== originalRoomId && light.roomId !== createdRoom.id) continue;
      expect(light.roomId).toBe(expectedRoom({ x: light.position.x, z: light.position.z }));
    }
    for (const camera of next.cameras) {
      if (camera.roomId !== originalRoomId && camera.roomId !== createdRoom.id) continue;
      expect(camera.roomId).toBe(expectedRoom({ x: camera.position.x, z: camera.position.z }));
    }
  });

  it("preserves openings when a shared boundary wall is bisected for the split", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const front = source.walls.find((wall) => wall.extensions?.wallSide === "front")!;
    const openingId = source.openings.find((opening) => opening.wallId === front.id)?.id;
    expect(openingId).toBeTruthy();
    const next = splitVertically(source);
    const surviving = next.openings.find((item) => item.id === openingId)
      ?? next.openings.find((item) => item.kind === "door");
    expect(surviving).toBeTruthy();
    expect(next.walls.some((wall) => wall.id === surviving!.wallId)).toBe(true);
    expect(validateInteriorProject(next).issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });
});
