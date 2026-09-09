import { describe, expect, it } from "vitest";
import {
  surfacePaintCurrentFinishLabel,
  surfacePaintScopeLabel,
} from "./surfacePaintFeedback";

describe("surfacePaintFeedback", () => {
  it("labels explicit paint scopes without inventing bulk edits", () => {
    expect(surfacePaintScopeLabel({ target: "floor", selectionCount: 0 })).toBe("This room floor");
    expect(surfacePaintScopeLabel({ target: "ceiling", selectionCount: 0 })).toBe("This room ceiling");
    expect(surfacePaintScopeLabel({ target: "wall", wallSide: "North", selectionCount: 0 })).toBe("Wall · North");
    expect(surfacePaintScopeLabel({
      target: "selection",
      selectionCount: 2,
      slotName: "fronts",
    })).toBe("Selection · 2 objects · slot fronts");
  });

  it("summarizes the current finish for the paint panel", () => {
    expect(surfacePaintCurrentFinishLabel({ finishName: "Oak Woodgrain" })).toBe("Oak Woodgrain");
    expect(surfacePaintCurrentFinishLabel({ materialId: "lr-material-natural-oak" }))
      .toBe("lr-material-natural-oak");
    expect(surfacePaintCurrentFinishLabel({})).toBe("None assigned");
  });
});
