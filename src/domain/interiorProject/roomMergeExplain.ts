import type { InteriorProject } from "./types";

export type InteriorRoomMergeBlock = {
  code: "same-room" | "missing-room" | "hole-topology" | "not-adjacent" | "invalid-topology";
  message: string;
};

function roomHasHoles(room: InteriorProject["rooms"][number] | undefined) {
  return Boolean(room?.holeLoopIds?.length);
}

/**
 * Why a merge cannot proceed (holes, adjacency, topology). Null means the caller may attempt merge.
 */
export function explainInteriorRoomMergeBlock(
  project: InteriorProject,
  targetRoomId: string,
  absorbedRoomId: string,
): InteriorRoomMergeBlock | null {
  if (targetRoomId === absorbedRoomId) {
    return {
      code: "same-room",
      message: "Pick a different adjacent room to merge into this one.",
    };
  }
  const target = project.rooms.find((room) => room.id === targetRoomId);
  const absorbed = project.rooms.find((room) => room.id === absorbedRoomId);
  if (!target || !absorbed) {
    return {
      code: "missing-room",
      message: "One of the rooms is missing. Switch rooms and try merge again.",
    };
  }
  if (!target.outerLoopId || !absorbed.outerLoopId) {
    return {
      code: "invalid-topology",
      message: "Those rooms are missing closed wall loops, so merge cannot run. Redraw or split again first.",
    };
  }
  const holeRooms = [target, absorbed].filter(roomHasHoles);
  if (holeRooms.length) {
    const names = holeRooms.map((room) => `"${room.name}"`).join(" and ");
    return {
      code: "hole-topology",
      message:
        `Cannot merge ${names}: room merge only supports hole-free faces. `
        + "Delete the interior cutout/hole (or redraw those areas as separate rooms), then merge adjacent rooms that share a wall.",
    };
  }
  const targetLoop = project.loops.find((loop) => loop.id === target.outerLoopId);
  const absorbedLoop = project.loops.find((loop) => loop.id === absorbed.outerLoopId);
  if (!targetLoop || !absorbedLoop) {
    return {
      code: "invalid-topology",
      message: "Room wall loops are incomplete. Fix the walls, then try merge again.",
    };
  }
  const targetWallIds = new Set(targetLoop.wallUses.map((use) => use.wallId));
  const shared = absorbedLoop.wallUses.some((use) => targetWallIds.has(use.wallId));
  if (!shared) {
    return {
      code: "not-adjacent",
      message:
        `"${absorbed.name}" does not share a wall with "${target.name}". `
        + "Merge only adjacent rooms, or draw a shared wall between them first.",
    };
  }
  return null;
}
