import { describe, expect, it } from "vitest";
import {
  contextualRailCommands,
  resolveContextualRailKind,
} from "./contextualCommandRail";

describe("contextual command rail (§4.1)", () => {
  it("shows select / measure / camera with nothing selected", () => {
    expect(resolveContextualRailKind({ activeWallId: null, selectedObjects: [] })).toBe("none");
    expect(contextualRailCommands("none").map((item) => item.id)).toEqual([
      "select", "measure", "camera",
    ]);
  });

  it("shows wall commands when a wall is active", () => {
    expect(resolveContextualRailKind({
      activeWallId: "lr-wall-back",
      selectedObjects: [],
    })).toBe("wall");
    expect(contextualRailCommands("wall").map((item) => item.id)).toEqual([
      "material", "add-panel", "hide-wall",
    ]);
  });

  it("prefers panel / cabinet over wall when objects are selected", () => {
    expect(resolveContextualRailKind({
      activeWallId: "lr-wall-back",
      selectedObjects: [{ category: "wall-panel", catalogItemId: "living:decorative-panel" }],
    })).toBe("panel");
    expect(contextualRailCommands("panel").map((item) => item.id)).toEqual([
      "flip-side", "duplicate", "material", "delete",
    ]);
    expect(resolveContextualRailKind({
      activeWallId: null,
      selectedObjects: [{ kind: "cabinet", category: "base" }],
    })).toBe("cabinet");
  });

  it("hides Measure in Model view", () => {
    expect(contextualRailCommands("none", { workspaceView: "model" }).map((item) => item.id))
      .toEqual(["select", "camera"]);
    expect(contextualRailCommands("none", { workspaceView: "plan" }).map((item) => item.id))
      .toEqual(["select", "measure", "camera"]);
  });
});
