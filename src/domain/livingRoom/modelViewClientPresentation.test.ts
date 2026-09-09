import { describe, expect, it } from "vitest";
import { modelViewClientPresentationProps } from "./modelViewClientPresentation";

describe("modelViewClientPresentationProps", () => {
  it("preserves authoring selection and grid outside Present", () => {
    expect(modelViewClientPresentationProps({
      presentation: false,
      selectedIds: ["a"],
      activeOpeningId: "o1",
      activeWallId: "w1",
      showGrid: true,
    })).toEqual({
      selectedIds: ["a"],
      activeOpeningId: "o1",
      activeWallId: "w1",
      showGrid: true,
      interactive: true,
    });
  });

  it("clears selection marks and grid for client Present", () => {
    expect(modelViewClientPresentationProps({
      presentation: true,
      selectedIds: ["a"],
      activeOpeningId: "o1",
      activeWallId: "w1",
      showGrid: true,
    })).toEqual({
      selectedIds: [],
      activeOpeningId: null,
      activeWallId: null,
      showGrid: false,
      interactive: false,
    });
  });
});
