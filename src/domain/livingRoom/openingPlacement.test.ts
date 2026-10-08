import { describe, expect, it } from "vitest";
import type { InteriorProject } from "../interiorProject";
import {
  centredOpeningOffset,
  moveOpeningOffset,
  openingCentreAtPoint,
  openingOffsetAtPoint,
  resizeOpeningFromStart,
  resizeOpeningWidth,
  snapOpeningOffset,
} from "./openingPlacement";

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

describe("snapOpeningOffset (Phase 4)", () => {
  const project = {
    walls: [wall],
    openings: [{ id: "existing", wallId: "wall", kind: "window", offsetMm: 1000, widthMm: 1200, heightMm: 1200, sillHeightMm: 900 }],
    objects: [],
  } as unknown as InteriorProject;

  it("centres a 900 door on the wall midpoint within the radius and names it", () => {
    const hit = snapOpeningOffset(project, wall, { centreMm: 3030, widthMm: 900, thresholdMm: 60, gridMm: 50 });
    expect(hit.offsetMm).toBe(2550);
    expect(hit.snap?.candidate?.label).toBe("Wall midpoint");
    expect(hit.snap?.point).toEqual({ x: 3000, z: 0 });
  });

  it("abuts another opening's edge", () => {
    const hit = snapOpeningOffset(project, wall, { centreMm: 2680, widthMm: 900, thresholdMm: 60, gridMm: 50 });
    expect(hit.offsetMm).toBe(2200);
    expect(hit.snap?.candidate?.label).toBe("Window edge");
  });

  it("ignores its own edges and falls back to the grid on the start offset", () => {
    const own = snapOpeningOffset(project, wall, { centreMm: 1600, widthMm: 1200, excludeOpeningId: "existing", thresholdMm: 60, gridMm: 50 });
    expect(own.snap).toBeNull();
    expect(own.offsetMm).toBe(1000);
    const free = snapOpeningOffset(project, wall, { centreMm: 4327, widthMm: 900, thresholdMm: 60, gridMm: 50 });
    expect(free.snap).toBeNull();
    expect(free.offsetMm).toBe(3900);
  });

  it("projects a pointer onto the wall and computes the centred offset", () => {
    expect(openingCentreAtPoint(wall, { x: 2577, z: 400 })).toBe(2577);
    expect(centredOpeningOffset(wall, 900)).toBe(2550);
  });
});
