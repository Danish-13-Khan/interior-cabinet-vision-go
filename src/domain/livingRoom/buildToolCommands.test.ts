import { describe, expect, it, vi } from "vitest";
import {
  applyBuildCommand,
  createBuildCommandState,
  reduceBuildCommand,
} from "./buildToolCommands";

describe("buildToolCommands", () => {
  it("arms a placement tool without mutating geometry", () => {
    const handlers = {
      resizeRoom: vi.fn(),
      createWall: vi.fn(),
      placeOpening: vi.fn(),
      requestUnderlayUpload: vi.fn(),
    };
    const next = applyBuildCommand(
      createBuildCommandState(),
      { type: "beginDraft", tool: "place-door" },
      handlers,
    );
    expect(next.activeTool).toBe("place-door");
    expect(next.draft?.tool).toBe("place-door");
    expect(handlers.placeOpening).not.toHaveBeenCalled();
  });

  it("cancels draft back to select", () => {
    const armed = reduceBuildCommand(createBuildCommandState(), {
      type: "beginDraft",
      tool: "draw-wall",
    });
    const cancelled = reduceBuildCommand(armed, { type: "cancelDraft" });
    expect(cancelled).toEqual({ activeTool: "select", draft: null });
  });

  it("commits placeOpening through the rectangular adapter once", () => {
    const handlers = {
      resizeRoom: vi.fn(),
      createWall: vi.fn(),
      placeOpening: vi.fn(),
      requestUnderlayUpload: vi.fn(),
    };
    const armed = applyBuildCommand(
      createBuildCommandState(),
      { type: "beginDraft", tool: "place-door" },
      handlers,
    );
    const committed = applyBuildCommand(
      armed,
      { type: "placeOpening", wallId: "wall-front", kind: "door" },
      handlers,
    );
    expect(handlers.placeOpening).toHaveBeenCalledWith("wall-front", "door");
    expect(committed.draft).toBeNull();
    expect(committed.activeTool).toBe("place-door");
  });

  it("requests underlay upload when the upload tool is armed", () => {
    const handlers = {
      resizeRoom: vi.fn(),
      createWall: vi.fn(),
      placeOpening: vi.fn(),
      requestUnderlayUpload: vi.fn(),
    };
    applyBuildCommand(
      createBuildCommandState(),
      { type: "beginDraft", tool: "upload-underlay" },
      handlers,
    );
    expect(handlers.requestUnderlayUpload).toHaveBeenCalledTimes(1);
  });
});
