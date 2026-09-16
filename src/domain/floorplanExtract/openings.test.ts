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
});
