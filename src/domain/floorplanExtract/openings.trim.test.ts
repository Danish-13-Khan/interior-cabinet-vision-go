import { describe, expect, it } from "vitest";
import { attachOpenings } from "./openings";
import { buildWallGraph } from "./wallGraph";
import type { ExtractPolygon } from "./types";

describe("opening trim containment", () => {
  it("rejects when remaining host span is empty after clamp", () => {
    // Host is only 0.02 m long; opening claims 0.5 m — after containment filter may be unmatched earlier,
    // but if overshoot within tol somehow matched, trim must not invent 50 mm.
    const walls: ExtractPolygon[] = [
      { id: "wall-0", outer: [[0, 0], [0.02, 0], [0.02, 0.2], [0, 0.2]] },
    ];
    const graph = buildWallGraph(walls);
    const att = attachOpenings(
      [{ id: "door-0", outer: [[-0.1, 0], [0.4, 0], [0.4, 0.2], [-0.1, 0.2]] }],
      graph,
    );
    expect(att["door-0"].status).not.toBe("matched");
  });
});
