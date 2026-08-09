import { describe, expect, it } from "vitest";
import {
  TECHNICAL_LINE_SPECS,
  assertCutHeavierThanHidden,
  assertOutlineHeavierThanInterior,
  getLineSpec,
  lineRoleClass,
} from "./technicalLineSystem";
import { draftingHatchDefs, hatchFill } from "./constructionGraphics/hatch";
import { renderPlanCarcassInterior } from "./constructionGraphics/planCarcass";

describe("technicalLineSystem", () => {
  it("defines all production line roles", () => {
    const roles = TECHNICAL_LINE_SPECS.map((spec) => spec.role);
    expect(roles).toEqual([
      "outline",
      "interior",
      "hidden",
      "phantom",
      "cut",
      "dimension",
      "guide",
      "center",
      "reference",
    ]);
  });

  it("keeps outline heavier than interior and cut heavier than hidden", () => {
    expect(assertOutlineHeavierThanInterior()).toBe(true);
    expect(assertCutHeavierThanHidden()).toBe(true);
    expect(getLineSpec("dimension").weightPx).toBeGreaterThan(
      getLineSpec("guide").weightPx,
    );
  });

  it("maps roles to stable CSS classes", () => {
    expect(lineRoleClass("hidden")).toBe("twod-line-hidden");
    expect(lineRoleClass("cut", "twod-section-cut")).toBe(
      "twod-line-cut twod-section-cut",
    );
  });
});

describe("drafting hatches", () => {
  it("emits shared hatch defs and denser section hatch lines", () => {
    const defs = draftingHatchDefs();
    expect(defs).toContain('id="hatch-section"');
    expect(defs).toContain('id="hatch-filler"');
    const hatch = hatchFill(0, 0, 20, 10, "section").join("");
    expect(hatch).toContain("twod-section-board");
    expect(hatch).toContain("twod-section-hatch");
    expect((hatch.match(/twod-section-hatch/g) ?? []).length).toBeGreaterThan(4);
  });

  it("draws denser plan carcass interiors", () => {
    const svg = renderPlanCarcassInterior(0, 0, 40, 30).join("");
    expect(svg).toContain("twod-line-interior");
    expect(svg).toContain("twod-carcass-side");
    expect(svg).toContain("twod-carcass-rear");
  });
});
