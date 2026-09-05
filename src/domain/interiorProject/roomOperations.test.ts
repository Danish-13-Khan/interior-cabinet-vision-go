import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { createWallSegment } from "./wallEditing";
import { explainInteriorRoomMergeBlock } from "./roomMergeExplain";
import { deleteInteriorRoom, mergeInteriorRooms } from "./roomOperations";
import { validateInteriorProject } from "./validation";

function splitStarter() {
  return createWallSegment(
    createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" }),
    { start: { x: 0, z: -2300 }, end: { x: 0, z: 2300 }, kind: "wall" },
  );
}

describe("H3 interior room operations", () => {
  it("deletes a room and its unshared topology while keeping another room active", () => {
    const split = splitStarter();
    const removedRoom = split.rooms.find((room) => room.id !== split.activeRoomId)!;
    const next = deleteInteriorRoom(split, removedRoom.id);
    expect(next.rooms).toHaveLength(1);
    expect(next.activeRoomId).toBe(split.activeRoomId);
    expect(next.rooms.some((room) => room.id === removedRoom.id)).toBe(false);
    expect(validateInteriorProject(next).issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("keeps an opening on a retained shared wall even when its legacy room hint is deleted", () => {
    const split = splitStarter();
    const removedRoom = split.rooms.find((room) => room.id !== split.activeRoomId)!;
    const sharedWall = split.walls.find((wall) => wall.extensions?.structuralKind === "room-split")!;
    const withLegacyOpening = {
      ...split,
      openings: [...split.openings, {
        id: "shared-door", roomId: removedRoom.id, wallId: sharedWall.id, kind: "door" as const,
        offsetMm: 500, widthMm: 900, heightMm: 2100, sillHeightMm: 0,
      }],
    };
    const next = deleteInteriorRoom(withLegacyOpening, removedRoom.id);
    expect(next.openings.find((opening) => opening.id === "shared-door")).toMatchObject({
      wallId: sharedWall.id, roomId: split.activeRoomId,
    });
  });

  it("merges H1-adjacent rooms by removing their shared split wall", () => {
    const split = splitStarter();
    const sourceRoomId = split.activeRoomId;
    const absorbedRoomId = split.rooms.find((room) => room.id !== sourceRoomId)!.id;
    const next = mergeInteriorRooms(split, sourceRoomId, absorbedRoomId);
    expect(next.rooms).toHaveLength(1);
    expect(next.rooms[0]?.id).toBe(sourceRoomId);
    expect(next.walls.some((wall) => wall.extensions?.structuralKind === "room-split")).toBe(false);
    expect(validateInteriorProject(next).issues.filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("drops absorbed authored surfaces that fall outside the merged face", () => {
    const split = splitStarter();
    const sourceRoomId = split.activeRoomId;
    const absorbedRoomId = split.rooms.find((room) => room.id !== sourceRoomId)!.id;
    const withOrphanZone = {
      ...split,
      surfaces: [...split.surfaces, {
        id: "orphan-zone", kind: "floor" as const, roomId: absorbedRoomId, loopId: null,
        polygon: [{ x: 9000, z: 9000 }, { x: 9100, z: 9000 }, { x: 9100, z: 9100 }],
        materialId: split.materials[0]?.id ?? null,
      }],
    };
    const next = mergeInteriorRooms(withOrphanZone, sourceRoomId, absorbedRoomId);
    expect(next.surfaces.some((surface) => surface.id === "orphan-zone")).toBe(false);
  });

  it("will not delete the last room or merge non-adjacent rooms", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    expect(deleteInteriorRoom(source, source.activeRoomId)).toBe(source);
    expect(mergeInteriorRooms(source, source.activeRoomId, "missing")).toBe(source);
  });

  it("blocks hole-bearing merges and explains the next step", () => {
    const split = splitStarter();
    const sourceRoomId = split.activeRoomId;
    const absorbedRoomId = split.rooms.find((room) => room.id !== sourceRoomId)!.id;
    const withHole = {
      ...split,
      rooms: split.rooms.map((room) =>
        room.id === absorbedRoomId ? { ...room, holeLoopIds: ["synthetic-hole-loop"] } : room),
    };
    const block = explainInteriorRoomMergeBlock(withHole, sourceRoomId, absorbedRoomId);
    expect(block?.code).toBe("hole-topology");
    expect(block?.message).toMatch(/hole-free|cutout|Cannot merge/i);
    expect(mergeInteriorRooms(withHole, sourceRoomId, absorbedRoomId)).toBe(withHole);
  });
});
