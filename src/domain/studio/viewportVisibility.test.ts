import { describe, expect, it } from "vitest";
import { viewportShowsObject } from "./viewportVisibility";

describe("viewport object visibility", () => {
  it("hides and isolates objects without dropping architecture nodes", () => {
    const hidden = { isolatedObjectId: null, hiddenObjectIds: ["cab"] };
    expect(viewportShowsObject("cab", hidden)).toBe(false);
    expect(viewportShowsObject(null, hidden)).toBe(true);
    const isolated = { isolatedObjectId: "cab", hiddenObjectIds: [] };
    expect(viewportShowsObject("cab", isolated)).toBe(true);
    expect(viewportShowsObject("other", isolated)).toBe(false);
  });
});
