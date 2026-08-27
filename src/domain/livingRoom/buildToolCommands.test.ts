import { describe, expect, it, vi } from "vitest";
import {
  applyBuildCommand,
  createBuildCommandState,
  reduceBuildCommand,
  type BuildCommandHandlers,
} from "./buildToolCommands";

function mockHandlers(overrides: Partial<BuildCommandHandlers> = {}): BuildCommandHandlers {
  return {
    resizeRoom: vi.fn(),
    createWall: vi.fn(),
    createWallSegment: vi.fn(),
    createRoom: vi.fn(),
    createSurface: vi.fn(),
    updateSurface: vi.fn(),
    deleteSurface: vi.fn(),
    placeColumn: vi.fn(),
    splitWall: vi.fn(),
    deleteWall: vi.fn(),
    updateWall: vi.fn(),
    joinCoincidentNodes: vi.fn(),
    placeOpening: vi.fn(),
    updateOpening: vi.fn(),
    deleteOpening: vi.fn(),
    requestUnderlayUpload: vi.fn(),
    ...overrides,
  };
}

describe("buildToolCommands", () => {
  it("arms a placement tool without mutating geometry", () => {
    const handlers = mockHandlers();
    const next = applyBuildCommand(createBuildCommandState(), { type: "beginDraft", tool: "place-door" }, handlers);
    expect(next.activeTool).toBe("place-door");
    expect(next.draft?.tool).toBe("place-door");
    expect(handlers.placeOpening).not.toHaveBeenCalled();
  });

  it("cancels draft back to select", () => {
    const armed = reduceBuildCommand(createBuildCommandState(), { type: "beginDraft", tool: "draw-wall" });
    expect(reduceBuildCommand(armed, { type: "cancelDraft" })).toEqual({ activeTool: "select", draft: null });
  });

  it("commits placeOpening through the rectangular adapter once", () => {
    const handlers = mockHandlers();
    const armed = applyBuildCommand(createBuildCommandState(), { type: "beginDraft", tool: "place-door" }, handlers);
    const committed = applyBuildCommand(armed, { type: "placeOpening", wallId: "wall-front", kind: "door" }, handlers);
    expect(handlers.placeOpening).toHaveBeenCalledWith("wall-front", "door", undefined, undefined);
    expect(committed.draft).toBeNull();
  });

  it("routes D3 wall commands through explicit handlers", () => {
    const handlers = mockHandlers();
    applyBuildCommand(createBuildCommandState("draw-wall"), {
      type: "createWallSegment", start: { x: 0, z: 0 }, end: { x: 1000, z: 0 },
    }, handlers);
    applyBuildCommand(createBuildCommandState("draw-wall"), { type: "splitWall", wallId: "wall-1" }, handlers);
    applyBuildCommand(createBuildCommandState("draw-wall"), { type: "deleteWall", wallId: "wall-1" }, handlers);
    applyBuildCommand(createBuildCommandState("draw-wall"), { type: "updateWall", wallId: "wall-1", patch: { thicknessMm: 180 } }, handlers);
    applyBuildCommand(createBuildCommandState("draw-wall"), { type: "joinCoincidentNodes" }, handlers);
    expect(handlers.createWallSegment).toHaveBeenCalledWith({ x: 0, z: 0 }, { x: 1000, z: 0 });
    expect(handlers.splitWall).toHaveBeenCalledWith("wall-1", undefined);
    expect(handlers.deleteWall).toHaveBeenCalledWith("wall-1");
    expect(handlers.updateWall).toHaveBeenCalledWith("wall-1", { thicknessMm: 180 });
    expect(handlers.joinCoincidentNodes).toHaveBeenCalledTimes(1);
  });

  it("commits a closed room drawing through the command layer", () => {
    const handlers = mockHandlers();
    const drawing = { kind: "polygon" as const, points: [{ x: 0, z: 0 }, { x: 2000, z: 0 }, { x: 0, z: 2000 }] };
    const result = applyBuildCommand(createBuildCommandState("draw-room"), { type: "createRoom", drawing }, handlers);
    expect(handlers.createRoom).toHaveBeenCalledWith(drawing);
    expect(result.draft).toBeNull();
  });

  it("routes Phase E surface and structural commands", () => {
    const handlers = mockHandlers();
    const drawing = { kind: "polygon" as const, points: [{ x: 0, z: 0 }, { x: 1000, z: 0 }, { x: 0, z: 1000 }] };
    applyBuildCommand(createBuildCommandState("draw-surface"), { type: "createSurface", drawing, materialId: "mat-1" }, handlers);
    applyBuildCommand(createBuildCommandState("draw-partition"), {
      type: "createWallSegment", start: { x: 0, z: 0 }, end: { x: 0, z: 1000 }, wallKind: "partition",
    }, handlers);
    applyBuildCommand(createBuildCommandState("place-column"), { type: "placeColumn", position: { x: 500, z: 500 } }, handlers);
    expect(handlers.createSurface).toHaveBeenCalledWith(drawing, "mat-1");
    expect(handlers.createWallSegment).toHaveBeenCalledWith({ x: 0, z: 0 }, { x: 0, z: 1000 }, "partition");
    expect(handlers.placeColumn).toHaveBeenCalledWith({ x: 500, z: 500 });
  });
});
