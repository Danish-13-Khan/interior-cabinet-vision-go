import { describe, expect, it } from "vitest";
import { pickNearestSnapGuide } from "./planSnapping";

describe("snap guide picking", () => {
  it("picks the nearest labelled guide within threshold", () => {
    const hit = pickNearestSnapGuide(
      100,
      [
        { axis: "x", valueMm: 150, kind: "object", label: "Cabinet" },
        { axis: "x", valueMm: 105, kind: "opening", label: "door edge" },
        { axis: "x", valueMm: 400, kind: "grid", label: "Grid" },
      ],
      30,
    );
    expect(hit?.kind).toBe("opening");
    expect(hit?.label).toBe("door edge");
  });

  it("returns null outside threshold", () => {
    expect(pickNearestSnapGuide(0, [{ axis: "x", valueMm: 500, kind: "wall", label: "Wall" }], 20)).toBeNull();
  });
});
