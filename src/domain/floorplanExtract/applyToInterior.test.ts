import { describe, expect, it } from "vitest";
import { createEmptyInteriorProject } from "../interiorProject/defaults";
import { applyFloorplanToInterior } from "./applyToInterior";
import { normalizeExtraction } from "./normalize";
import type { ExtractionResult } from "./types";

function rect(id: string, x0: number, y0: number, x1: number, y1: number) {
  return { id, outer: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as [number, number][] };
}

describe("applyFloorplanToInterior opening heights", () => {
  it("fits a window whose sill is above the extracted wall height", () => {
    const raw: ExtractionResult = {
      schema_version: "1.0",
      units: "meters",
      defaults: { wall_height_m: 2.7 },
      polygons: {
        rooms: [rect("room-0", 0.2, 0.2, 4, 4)],
        walls: [
          rect("wall-0", 0, 0, 4.2, 0.2),
          rect("wall-1", 4, 0, 4.2, 4.2),
          rect("wall-2", 0, 4, 4.2, 4.2),
          rect("wall-3", 0, 0, 0.2, 4.2),
        ],
        doors: [],
        windows: [{
          ...rect("window-0", 4, 1.5, 4.2, 2.5),
          opening: { sill_m: 4, height_m: 1.2 },
        }],
      },
    };
    const normalized = normalizeExtraction(raw, { acceptThinWalls: true });
    expect(normalized.canApply).toBe(true);
    const project = applyFloorplanToInterior(createEmptyInteriorProject({ id: "p1" }), normalized);
    const opening = project.openings.find((item) => item.id === "window-0")!;
    const wall = project.walls.find((item) => item.id === opening.wallId)!;
    expect(opening.sillHeightMm + opening.heightMm).toBeLessThanOrEqual(wall.heightMm);
    expect(opening.heightMm).toBe(1200);
    expect(opening.sillHeightMm).toBe(wall.heightMm - 1200);
  });
});
