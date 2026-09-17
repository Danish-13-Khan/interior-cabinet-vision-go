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

  it("matches both rooms of a shared-wall house even with a stub and a gapped T", () => {
    const walls = [
      wall("south", 0, 0, 4, 0),
      wall("north", 0, 6, 4, 6),
      wall("west", 0, 0, 0, 6),
      wall("east", 4, 0, 4, 6),
      wall("mid", 0.35, 3, 3.65, 3),
      wall("stub", 2, 0, 2, 0.7),
    ];
    const graph = buildWallGraph(walls);
    const matched = matchRooms([
      { id: "room-0", outer: [[0.2, 0.2], [3.8, 0.2], [3.8, 2.8], [0.2, 2.8]] },
      { id: "room-1", outer: [[0.2, 3.2], [3.8, 3.2], [3.8, 5.8], [0.2, 5.8]] },
    ], graph);
    expect(matched["room-0"].status).toBe("matched");
    expect(matched["room-1"].status).toBe("matched");
    if (matched["room-0"].status === "matched" && matched["room-1"].status === "matched") {
      expect(matched["room-0"].wallUses.length).toBeGreaterThanOrEqual(4);
      expect(matched["room-1"].wallUses.length).toBeGreaterThanOrEqual(4);
      const a = new Set(matched["room-0"].wallUses.map((u) => u.wallSourceId));
      const b = new Set(matched["room-1"].wallUses.map((u) => u.wallSourceId));
      expect([...a].some((id) => b.has(id))).toBe(true);
    }
  });
});
