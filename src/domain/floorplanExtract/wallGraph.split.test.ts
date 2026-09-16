import { describe, expect, it } from "vitest";
import { buildWallGraph } from "./wallGraph";
import type { ExtractPolygon } from "./types";

function hWall(id: string, x0: number, x1: number, y: number, t = 0.2): ExtractPolygon {
  return { id, outer: [[x0, y - t / 2], [x1, y - t / 2], [x1, y + t / 2], [x0, y + t / 2]] };
}
function vWall(id: string, x: number, y0: number, y1: number, t = 0.2): ExtractPolygon {
  return { id, outer: [[x - t / 2, y0], [x + t / 2, y0], [x + t / 2, y1], [x - t / 2, y1]] };
}

describe("T-junction split ids", () => {
  it("allocates unique sourceIds for repeated splits on one host", () => {
    const walls = [
      hWall("host", 0, 4, 0),
      vWall("p2", 2, -1, 1),
      vWall("p1", 1, -1, 1),
    ];
    const graph = buildWallGraph(walls);
    const ids = graph.edges.map((e) => e.sourceId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => id === "host#b").length).toBe(0);
  });
});
