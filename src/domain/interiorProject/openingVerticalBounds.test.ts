import { describe, expect, it } from "vitest";
import rectangleV2 from "../../../fixtures/plan-topology/rectangle.v2.golden.json";
import {
  clampOpeningVertical,
  openingVerticalExceedsWall,
} from "./openingVerticalBounds";
import { validateInteriorProject } from "./validation";

describe("opening vertical bounds", () => {
  it("lowers an oversized sill so the opening still fits the wall", () => {
    expect(clampOpeningVertical({ heightMm: 1200, sillHeightMm: 4000 }, 2700)).toEqual({
      heightMm: 1200,
      sillHeightMm: 1500,
    });
  });

  it("caps height to the wall and sits a tall opening on the floor", () => {
    expect(clampOpeningVertical({ heightMm: 3000, sillHeightMm: 4000 }, 2700)).toEqual({
      heightMm: 2700,
      sillHeightMm: 0,
    });
  });

  it("leaves an in-range window unchanged", () => {
    const opening = { heightMm: 1300, sillHeightMm: 750 };
    expect(clampOpeningVertical(opening, 2800)).toEqual(opening);
    expect(openingVerticalExceedsWall(opening, 2800)).toBe(false);
  });

  it("flags a sill that places the opening above the host wall", () => {
    const source = structuredClone(rectangleV2);
    source.openings[0] = { ...source.openings[0]!, sillHeightMm: 4000, heightMm: 1200 };
    const result = validateInteriorProject(source);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "opening-vertical-out-of-range",
        severity: "warning",
      }),
    ]));
    expect(result.project.openings[0]?.sillHeightMm).toBe(4000);
  });
});
