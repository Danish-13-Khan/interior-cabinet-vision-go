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

describe("H3 room delete/merge undo granularity (domain-only stack)", () => {
  /** Domain-only stack for operation granularity — production coverage lives in editorHistoryCore.test.ts. */
  function withHistory(initial: ReturnType<typeof splitStarter>) {
    const past: Array<typeof initial> = [];
    let current = initial;
    return {
      get value() {
        return current;
      },
      commit(next: typeof initial) {
        past.push(current);
        current = next;
        return current;
      },
      undo() {
        const previous = past.pop();
        if (!previous) return current;
        current = previous;
        return current;
      },
      pastLength() {
        return past.length;
      },
    };
  }

  it("undoes room delete and merge as separate editor-relevant steps", () => {
    const history = withHistory(splitStarter());
    const sourceRoomId = history.value.activeRoomId;
    const absorbedRoomId = history.value.rooms.find((room) => room.id !== sourceRoomId)!.id;
    expect(history.value.rooms).toHaveLength(2);

    history.commit(mergeInteriorRooms(history.value, sourceRoomId, absorbedRoomId));
    expect(history.value.rooms).toHaveLength(1);
    expect(history.value.walls.some((wall) => wall.extensions?.structuralKind === "room-split")).toBe(false);

    history.undo();
    expect(history.value.rooms).toHaveLength(2);
    expect(history.value.rooms.some((room) => room.id === absorbedRoomId)).toBe(true);
    expect(history.value.walls.some((wall) => wall.extensions?.structuralKind === "room-split")).toBe(true);

    const removedRoom = history.value.rooms.find((room) => room.id !== history.value.activeRoomId)!;
    history.commit(deleteInteriorRoom(history.value, removedRoom.id));
    expect(history.value.rooms).toHaveLength(1);
    expect(history.value.rooms.some((room) => room.id === removedRoom.id)).toBe(false);

    history.undo();
    expect(history.value.rooms).toHaveLength(2);
    expect(history.value.rooms.some((room) => room.id === removedRoom.id)).toBe(true);
    expect(validateInteriorProject(history.value).issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(history.pastLength()).toBe(0);
  });
});
