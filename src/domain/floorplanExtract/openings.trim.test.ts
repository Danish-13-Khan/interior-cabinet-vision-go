import { describe, expect, it } from "vitest";
import { attachOpenings } from "./openings";
import { buildWallGraph } from "./wallGraph";
import type { ExtractPolygon, WallGraph } from "./types";

describe("opening trim containment", () => {
  it("rejects an opening that overshoots the host beyond 25 mm", () => {
    const walls: ExtractPolygon[] = [
      { id: "wall-0", outer: [[0, 0], [0.2, 0], [0.2, 0.2], [0, 0.2]] },
    ];
    const graph = buildWallGraph(walls);
    const att = attachOpenings(
      [{ id: "door-0", outer: [[-0.1, 0], [0.4, 0], [0.4, 0.2], [-0.1, 0.2]] }],
      graph,
    );
    expect(att["door-0"].status).not.toBe("matched");
  });

  it("rejects when trim leaves an empty interval on the host", () => {
    const graph: WallGraph = {
      snap: 0.15,
      nodes: [
        { id: 0, x: 0, y: 0.1 },
        { id: 1, x: 1, y: 0.1 },
      ],
      edges: [{
        id: 0, a: 0, b: 1, thickM: 0.2, lengthM: 1, role: "interior",
        sourceId: "wall-0", thickened: false, diagonalCollapsed: false,
      }],
    };
    const att = attachOpenings(
      [{ id: "door-0", outer: [[-0.02, 0.08], [-0.001, 0.08], [-0.001, 0.12], [-0.02, 0.12]] }],
      graph,
    );
    expect(att["door-0"].status).not.toBe("matched");
  });

  it("keeps a 20 mm trimmed span and never expands it to 50 mm", () => {
    // Hand-built host so we exercise trim math, not candidate rejection.
    const graph: WallGraph = {
      snap: 0.15,
      nodes: [
        { id: 0, x: 0, y: 0.1 },
        { id: 1, x: 1, y: 0.1 },
      ],
      edges: [{
        id: 0,
        a: 0,
        b: 1,
        thickM: 0.2,
        lengthM: 1,
        role: "interior",
        sourceId: "wall-0",
        thickened: false,
        diagonalCollapsed: false,
      }],
    };
    // Along-wall 40 mm (dx>=dy so classified horizontal), y band thin around centerline.
    // 0.98..1.02 overhangs 20 mm (≤ 25 mm tol) → trim leaves 20 mm; must not invent 50 mm.
    const att = attachOpenings(
      [{ id: "door-0", outer: [[0.98, 0.08], [1.02, 0.08], [1.02, 0.12], [0.98, 0.12]] }],
      graph,
    );
    expect(att["door-0"].status).toBe("matched");
    if (att["door-0"].status === "matched") {
      expect(att["door-0"].widthM).toBeCloseTo(0.02, 5);
      expect(att["door-0"].widthM).toBeLessThan(0.05);
      expect(att["door-0"].trimmed).toBe(true);
    }
  });
});
