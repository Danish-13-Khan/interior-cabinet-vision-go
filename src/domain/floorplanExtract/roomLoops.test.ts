import { describe, expect, it } from "vitest";
import { matchRooms } from "./roomLoops";
import { buildWallGraph } from "./wallGraph";
import type { ExtractPolygon } from "./types";

function wall(id: string, x0: number, y0: number, x1: number, y1: number, t = 0.2): ExtractPolygon {
  // axis-aligned thick strip
  if (Math.abs(y0 - y1) < 1e-9) {
    return { id, outer: [[x0, y0 - t / 2], [x1, y0 - t / 2], [x1, y0 + t / 2], [x0, y0 + t / 2]] };
  }
  return { id, outer: [[x0 - t / 2, y0], [x0 + t / 2, y0], [x0 + t / 2, y1], [x0 - t / 2, y1]] };
}

describe("matchRooms closed loops", () => {
  it("accepts a closed rectangle and rejects a missing wall", () => {
    const walls = [
      wall("wall-0", 0, 0, 4, 0),
      wall("wall-1", 4, 0, 4, 3),
      wall("wall-2", 4, 3, 0, 3),
      wall("wall-3", 0, 3, 0, 0),
    ];
    const graph = buildWallGraph(walls);
    const roomOuter: [number, number][] = [[0.1, 0.1], [3.9, 0.1], [3.9, 2.9], [0.1, 2.9]];
    const ok = matchRooms([{ id: "room-0", outer: roomOuter }], graph);
    expect(ok["room-0"].status).toBe("matched");
    if (ok["room-0"].status === "matched") {
      expect(ok["room-0"].wallUses.length).toBe(4);
      expect(ok["room-0"].wallUses.every((u) => u.direction === "forward" || u.direction === "reverse")).toBe(true);
    }

    const openGraph = buildWallGraph(walls.slice(0, 3));
    const bad = matchRooms([{ id: "room-0", outer: roomOuter }], openGraph);
    expect(bad["room-0"].status).toBe("unmatched");
  });
});
