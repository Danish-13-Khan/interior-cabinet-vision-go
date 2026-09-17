import { describe, expect, it } from "vitest";
import { attachOpenings } from "./openings";
import { buildWallGraph } from "./wallGraph";
import type { ExtractPolygon } from "./types";

describe("attachOpenings", () => {
  it("requires full containment on host wall", () => {
    const walls: ExtractPolygon[] = [
      { id: "wall-0", outer: [[0, 0], [3, 0], [3, 0.2], [0, 0.2]] },
    ];
    const graph = buildWallGraph(walls);
    const ok = attachOpenings(
      [{ id: "door-0", outer: [[0.5, 0], [1.5, 0], [1.5, 0.2], [0.5, 0.2]] }],
      graph,
    );
    expect(ok["door-0"].status).toBe("matched");

    const bad = attachOpenings(
      [{ id: "door-1", outer: [[2.5, 0], [4.0, 0], [4.0, 0.2], [2.5, 0.2]] }],
      graph,
    );
    expect(bad["door-1"].status).toBe("unmatched");
  });

  it("attaches a door-swing AABB on a vertical wall", () => {
    const walls: ExtractPolygon[] = [
      { id: "wall-0", outer: [[-0.1, 0], [0.1, 0], [0.1, 4], [-0.1, 4]] },
    ];
    const graph = buildWallGraph(walls);
    const att = attachOpenings(
      [{ id: "door-0", outer: [[0, 1], [0.85, 1], [0.85, 1.85], [0, 1.85]] }],
      graph,
    );
    expect(att["door-0"].status).toBe("matched");
    if (att["door-0"].status === "matched") {
      expect(att["door-0"].wallSourceId).toBe("wall-0");
      expect(att["door-0"].widthM).toBeGreaterThan(0.5);
    }
  });
});
