import { describe, expect, it } from "vitest";
import { buildDwgSuggestDraft } from "./dwgSuggestDraft";
import { applyDwgSuggestOverlap, classifyDwgSuggestOverlap } from "./dwgSuggestOverlap";

const candidate = { a: { x: 0, z: 0 }, b: { x: 1000, z: 0 } };

describe("DWG suggest overlap", () => {
  it("treats a reversed existing wall as covered regardless of thickness", () => {
    expect(classifyDwgSuggestOverlap(candidate, [
      { start: { x: 1000, z: 0 }, end: { x: 0, z: 0 } },
    ])).toBe("covered");
  });

  it("treats split collinear pieces as covering the original run", () => {
    expect(classifyDwgSuggestOverlap(candidate, [
      { start: { x: 0, z: 0 }, end: { x: 400, z: 0 } },
      { start: { x: 400, z: 0 }, end: { x: 1000, z: 0 } },
    ])).toBe("covered");
  });

  it("flags a collinear partial overlap and blocks accept", () => {
    expect(classifyDwgSuggestOverlap(candidate, [
      { start: { x: 250, z: 0 }, end: { x: 750, z: 0 } },
    ])).toBe("partial");
    const draft = applyDwgSuggestOverlap(
      buildDwgSuggestDraft([{ layer: "Walls", ...candidate }]),
      [{ start: { x: 250, z: 0 }, end: { x: 750, z: 0 } }],
    );
    expect(draft.candidates[0]).toMatchObject({ overlap: "partial", accepted: false });
  });

  it("does not count a covered candidate as selectable", () => {
    const draft = applyDwgSuggestOverlap(
      buildDwgSuggestDraft([{ layer: "Walls", ...candidate }]),
      [{ start: { x: 0, z: 0 }, end: { x: 1000, z: 0 } }],
    );
    expect(draft.candidates[0]).toMatchObject({ overlap: "covered", accepted: false });
  });

  it("ignores a T-junction that is not collinear", () => {
    expect(classifyDwgSuggestOverlap(candidate, [
      { start: { x: 500, z: 0 }, end: { x: 500, z: 800 } },
    ])).toBe("none");
  });
});
