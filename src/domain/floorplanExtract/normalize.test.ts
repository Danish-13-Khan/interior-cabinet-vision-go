import { describe, expect, it } from "vitest";
import { normalizeExtraction } from "./normalize";
import type { ExtractionResult } from "./types";

function rect(id: string, x0: number, y0: number, x1: number, y1: number) {
  return { id, outer: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as [number, number][] };
}

describe("normalizeExtraction", () => {
  it("blocks apply on thin walls until accepted", () => {
    const raw: ExtractionResult = {
      schema_version: "1.0",
      units: "meters",
      polygons: {
        rooms: [rect("room-0", 0.2, 0.2, 4, 4)],
        walls: [
          rect("wall-0", 0, 0, 4.2, 0.1),
          rect("wall-1", 4.1, 0, 4.2, 4.2),
          rect("wall-2", 0, 4.1, 4.2, 4.2),
          rect("wall-3", 0, 0, 0.1, 4.2),
        ],
        doors: [],
        windows: [],
      },
    };
    const blocked = normalizeExtraction(raw);
    expect(blocked.canApply).toBe(false);
    expect(blocked.issues.some((i) => i.code === "thin_wall")).toBe(true);
    const allowed = normalizeExtraction(raw, { acceptThinWalls: true });
    expect(allowed.roomMatches["room-0"]?.status).toBe("matched");
  });

  it("matches openings on a closed wall box", () => {
    const raw: ExtractionResult = {
      schema_version: "1.0",
      units: "meters",
      polygons: {
        rooms: [rect("room-0", 0.2, 0.2, 4, 4)],
        walls: [
          rect("wall-0", 0, 0, 4.2, 0.2),
          rect("wall-1", 4, 0, 4.2, 4.2),
          rect("wall-2", 0, 4, 4.2, 4.2),
          rect("wall-3", 0, 0, 0.2, 4.2),
        ],
        doors: [rect("door-0", 1.5, 0, 2.5, 0.2)],
        windows: [rect("window-0", 4, 1.5, 4.2, 2.5)],
      },
    };
    const out = normalizeExtraction(raw, { acceptThinWalls: true });
    expect(out.openingAttachments["door-0"]?.status).toBe("matched");
    expect(out.openingAttachments["window-0"]?.status).toBe("matched");
    expect(out.canApply).toBe(true);
  });

  it("builds a room loop from the room footprint when extract walls are incomplete", () => {
    const raw: ExtractionResult = {
      schema_version: "1.0",
      units: "meters",
      polygons: {
        rooms: [{
          id: "room-0",
          outer: [[1.14, 5.14], [3.96, 5.14], [3.96, 12.07], [1.14, 12.07]],
        }],
        walls: [rect("wall-3", 3.725, 9.8, 3.905, 12.02)],
        doors: [{ id: "door-0", outer: [[1.74, 5.14], [2.52, 5.14], [2.52, 5.95], [1.74, 5.95]] }],
        windows: [],
      },
    };
    const out = normalizeExtraction(raw, { acceptThinWalls: true });
    expect(out.roomMatches["room-0"]?.status).toBe("matched");
    expect(out.openingAttachments["door-0"]?.status).toBe("matched");
    expect(out.canApply).toBe(true);
  });

  it("synthesizes walls for an unmatched room even when another room already matches", () => {
    const raw: ExtractionResult = {
      schema_version: "1.0",
      units: "meters",
      polygons: {
        rooms: [
          rect("room-good", 0.2, 0.2, 4, 4),
          {
            id: "room-0",
            outer: [[5, 5], [8, 5], [8, 9], [5, 9]],
          },
        ],
        walls: [
          // Closed box for room-good (same geometry as openings test)
          rect("wall-0", 0, 0, 4.2, 0.2),
          rect("wall-1", 4, 0, 4.2, 4.2),
          rect("wall-2", 0, 4, 4.2, 4.2),
          rect("wall-3", 0, 0, 0.2, 4.2),
          // Incomplete stub near room-0 only
          rect("wall-stub", 7.8, 6, 8.0, 8),
        ],
        doors: [{ id: "door-0", outer: [[5.5, 5], [6.5, 5], [6.5, 5.8], [5.5, 5.8]] }],
        windows: [],
      },
    };
    const first = normalizeExtraction(
      { ...raw, polygons: { ...raw.polygons, rooms: [raw.polygons.rooms[0]], doors: [], windows: [] } },
      { acceptThinWalls: true },
    );
    expect(first.roomMatches["room-good"]?.status).toBe("matched");

    const out = normalizeExtraction(raw, { acceptThinWalls: true });
    expect(out.roomMatches["room-good"]?.status).toBe("matched");
    expect(out.roomMatches["room-0"]?.status).toBe("matched");
    expect(out.openingAttachments["door-0"]?.status).toBe("matched");
    // Unmatched openings no longer block; rooms must be closed.
    expect(out.canApply).toBe(true);
  });
  it("synth room edges do not hard-block Apply without acceptThinWalls", () => {
    const raw: ExtractionResult = {
      schema_version: "1.0",
      units: "meters",
      polygons: {
        rooms: [{
          id: "room-0",
          outer: [[1.14, 5.14], [3.96, 5.14], [3.96, 12.07], [1.14, 12.07]],
        }],
        walls: [rect("wall-3", 3.725, 9.8, 3.905, 12.02)],
        doors: [],
        windows: [],
      },
    };
    const out = normalizeExtraction(raw);
    expect(out.roomMatches["room-0"]?.status).toBe("matched");
    expect(out.canApply).toBe(true);
    expect(out.issues.some((i) => i.code === "thin_wall" && i.blocksApply)).toBe(false);
  });
});
