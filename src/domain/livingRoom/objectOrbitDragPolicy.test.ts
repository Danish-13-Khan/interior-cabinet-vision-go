import { describe, expect, it } from "vitest";
import { samePoint3Mm, shouldBeginObjectBodyDrag } from "./objectOrbitDragPolicy";

describe("objectOrbitDragPolicy", () => {
  it("lets the first press on an unselected object orbit instead of drag", () => {
    expect(shouldBeginObjectBodyDrag({
      alreadySelected: false, shiftKey: false, metaKey: false, ctrlKey: false,
    })).toBe(false);
  });

  it("starts body-drag only on an already-selected object without modifiers", () => {
    expect(shouldBeginObjectBodyDrag({
      alreadySelected: true, shiftKey: false, metaKey: false, ctrlKey: false,
    })).toBe(true);
    expect(shouldBeginObjectBodyDrag({
      alreadySelected: true, shiftKey: true, metaKey: false, ctrlKey: false,
    })).toBe(false);
  });

  it("treats identical millimetre poses as unchanged", () => {
    expect(samePoint3Mm({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 })).toBe(true);
    expect(samePoint3Mm({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 4 })).toBe(false);
  });
});
