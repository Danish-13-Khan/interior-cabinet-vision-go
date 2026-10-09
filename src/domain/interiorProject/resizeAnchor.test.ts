import { describe, expect, it } from "vitest";
import { anchorForDraggedEdge, resizeAlongAxis } from "./resizeAnchor";

describe("resizeAlongAxis", () => {
  it("keeps the anchored edge and moves the other", () => {
    expect(resizeAlongAxis(0, 1000, 1400, "min")).toEqual({ minMm: 0, maxMm: 1400 });
    expect(resizeAlongAxis(0, 1000, 1400, "max")).toEqual({ minMm: -400, maxMm: 1000 });
    expect(resizeAlongAxis(0, 1000, 1400, "centre")).toEqual({ minMm: -200, maxMm: 1200 });
    expect(resizeAlongAxis(0, 1000, 600)).toEqual({ minMm: 200, maxMm: 800 });
  });

  it("maps a dragged edge to the anchor that holds the opposite edge, or the centre with Alt", () => {
    expect(anchorForDraggedEdge("max")).toBe("min");
    expect(anchorForDraggedEdge("min")).toBe("max");
    expect(anchorForDraggedEdge("max", true)).toBe("centre");
  });
});
