import { describe, expect, it } from "vitest";
import { moveOpeningOffset, openingOffsetAtPoint, resizeOpeningFromStart, resizeOpeningWidth } from "./openingPlacement";

const wall = {
  id: "wall", roomId: "room", start: { x: 0, z: 0 }, end: { x: 6000, z: 0 },
  heightMm: 2800, thicknessMm: 120, visible: true, materialId: null,
};

describe("openingOffsetAtPoint", () => {
  it("centers and snaps an opening at the projected wall position", () => {
    expect(openingOffsetAtPoint(wall, { x: 2577, z: 400 }, 900, 50)).toBe(2150);
  });

  it("clamps placement to both wall ends", () => {
    expect(openingOffsetAtPoint(wall, { x: -500, z: 0 }, 1200, 50)).toBe(0);
    expect(openingOffsetAtPoint(wall, { x: 7000, z: 0 }, 1200, 50)).toBe(4800);
  });

  it("previews snapped move and resize values without crossing boundaries", () => {
    expect(moveOpeningOffset({ startOffsetMm: 500, widthMm: 900, wallLengthMm: 3000, deltaMm: 173, snapMm: 50 })).toBe(650);
    expect(moveOpeningOffset({ startOffsetMm: 500, widthMm: 900, wallLengthMm: 3000, deltaMm: 9000, snapMm: 50 })).toBe(2100);
    expect(resizeOpeningWidth({ startWidthMm: 900, offsetMm: 500, wallLengthMm: 3000, deltaMm: 176, snapMm: 50 })).toBe(1100);
    expect(resizeOpeningWidth({ startWidthMm: 900, offsetMm: 2700, wallLengthMm: 3000, deltaMm: 500, snapMm: 50 })).toBe(300);
    expect(resizeOpeningFromStart({ startOffsetMm: 500, startWidthMm: 900, wallLengthMm: 3000, deltaMm: 150, snapMm: 50 })).toEqual({
      offsetMm: 650,
      widthMm: 750,
    });
  });
});
