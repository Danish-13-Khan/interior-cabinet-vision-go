import { describe, expect, it } from "vitest";
import { createEditorSnapshot, type EditorSnapshot } from "../domain/editorSnapshot";
import {
  cabinetProjectFromInteriorProject,
  deleteInteriorRoom,
  mergeInteriorRooms,
} from "../domain/interiorProject";
import { createLivingRoomStarterProject } from "../domain/livingRoom/preset";
import { createWallSegment } from "../domain/interiorProject/wallEditing";
import {
  commitEditorHistoryStacks,
  undoEditorHistoryStacks,
  type EditorHistoryStacks,
} from "./editorHistoryCore";

function splitStarter() {
  return createWallSegment(
    createLivingRoomStarterProject({ now: "2026-08-27T00:00:00.000Z" }),
    { start: { x: 0, z: -2300 }, end: { x: 0, z: 2300 }, kind: "wall" },
  );
}

/** Mirror useLivingRoomPlanEditor.commitDocument → commitSnapshot snapshot shape. */
function snapshotFromInterior(document: ReturnType<typeof splitStarter>): EditorSnapshot {
  const compatible = cabinetProjectFromInteriorProject(document);
  return createEditorSnapshot(
    compatible.project,
    compatible.room,
    [],
    null,
    null,
  );
}

function roomCount(snapshot: EditorSnapshot) {
  return snapshot.project.interiorDocument?.rooms.length ?? 0;
}

/**
 * Drive the same production history stack helpers that useEditorHistory uses,
 * with the same interior→cabinet snapshot path as useLivingRoomPlanEditor.
 */
function withProductionHistory(initialDocument: ReturnType<typeof splitStarter>) {
  let current = snapshotFromInterior(initialDocument);
  let stacks: EditorHistoryStacks = { past: [], future: [] };
  const statuses: string[] = [];

  return {
    get snapshot() {
      return current;
    },
    get document() {
      return current.project.interiorDocument!;
    },
    get statuses() {
      return statuses;
    },
    commitDocument(
      update: (doc: ReturnType<typeof splitStarter>) => ReturnType<typeof splitStarter>,
      status: string,
    ) {
      const nextDoc = {
        ...update(current.project.interiorDocument as ReturnType<typeof splitStarter>),
        updatedAt: "2026-08-27T00:00:01.000Z",
      };
      const next = snapshotFromInterior(nextDoc);
      stacks = commitEditorHistoryStacks(stacks, current);
      current = next;
      statuses.push(status);
    },
    undo() {
      const result = undoEditorHistoryStacks(stacks, current);
      if (!result.restore) return;
      stacks = result.stacks;
      current = result.restore;
      statuses.push("Undid the last change.");
    },
    canUndo() {
      return stacks.past.length > 0;
    },
  };
}

describe("production editor history (useEditorHistory stacks)", () => {
  it("records delete room and merge room via production history APIs and undoes both", () => {
    const history = withProductionHistory(splitStarter());
    expect(roomCount(history.snapshot)).toBe(2);

    const sourceRoomId = history.document.activeRoomId;
    const absorbedRoomId = history.document.rooms.find((room) => room.id !== sourceRoomId)!.id;

    history.commitDocument(
      (current) => mergeInteriorRooms(current, sourceRoomId, absorbedRoomId),
      "Merged rooms.",
    );
    expect(roomCount(history.snapshot)).toBe(1);
    expect(history.document.rooms[0]?.id).toBe(sourceRoomId);
    expect(history.canUndo()).toBe(true);

    history.undo();
    expect(roomCount(history.snapshot)).toBe(2);
    expect(history.document.rooms.some((room) => room.id === absorbedRoomId)).toBe(true);

    const removedRoom = history.document.rooms.find((room) => room.id !== history.document.activeRoomId)!;
    history.commitDocument(
      (current) => deleteInteriorRoom(current, removedRoom.id),
      "Deleted room.",
    );
    expect(roomCount(history.snapshot)).toBe(1);
    expect(history.document.rooms.some((room) => room.id === removedRoom.id)).toBe(false);

    history.undo();
    expect(roomCount(history.snapshot)).toBe(2);
    expect(history.document.rooms.some((room) => room.id === removedRoom.id)).toBe(true);
    expect(history.statuses).toEqual([
      "Merged rooms.",
      "Undid the last change.",
      "Deleted room.",
      "Undid the last change.",
    ]);
  });
});
