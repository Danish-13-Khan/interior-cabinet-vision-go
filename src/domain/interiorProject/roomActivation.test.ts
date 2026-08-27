import { describe, expect, it } from "vitest";
import { setActiveInteriorRoom, renameInteriorRoom } from "./roomActivation";
import { createLivingRoomStarterProject } from "../livingRoom/preset";

describe("roomActivation", () => {
  it("switches active room and renames without touching other rooms", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" });
    const roomId = source.activeRoomId;
    const renamed = renameInteriorRoom(source, roomId, "Living");
    expect(renamed.rooms.find((room) => room.id === roomId)?.name).toBe("Living");
    expect(renameInteriorRoom(source, roomId, "   ")).toBe(source);
    expect(setActiveInteriorRoom(source, "missing")).toBe(source);
    expect(setActiveInteriorRoom(source, roomId)).toBe(source);
  });
});
