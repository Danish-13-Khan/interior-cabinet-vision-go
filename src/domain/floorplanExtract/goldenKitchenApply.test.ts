import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createEmptyInteriorProject } from "../interiorProject/defaults";
import { attachToWall } from "../livingRoom/wardrobePlacement";
import { applyFloorplanToInterior } from "./applyToInterior";
import { parseDxfLineEntities, undirectedSegmentKey } from "./dxfLineEntities";
import { GOLDEN_KITCHEN_DXF_LINES_MM, goldenKitchenExtraction } from "./goldenKitchenExtract";
import { normalizeExtraction } from "./normalize";

const GOLDEN_DXF = join(process.cwd(), "fixtures/floorplanExtract/kitchen.dxf");

describe("golden kitchen import apply", () => {
  it("pairs kitchen.dxf centerlines with the extract JSON extents", () => {
    const parsed = parseDxfLineEntities(readFileSync(GOLDEN_DXF, "utf8"));
    expect(parsed).toHaveLength(4);
    const got = parsed.map(undirectedSegmentKey).sort();
    const want = GOLDEN_KITCHEN_DXF_LINES_MM.map(undirectedSegmentKey).sort();
    expect(got).toEqual(want);
    const xs = goldenKitchenExtraction().polygons.walls.flatMap((w) => w.outer.map((p) => p[0]));
    expect(Math.min(...xs)).toBeCloseTo(-0.1, 5);
    expect(Math.max(...xs)).toBeCloseTo(4.1, 5);
  });

  it("applies raised walls that a 900 mm cabinet can snap to", () => {
    const normalized = normalizeExtraction(goldenKitchenExtraction(), { acceptThinWalls: true });
    expect(normalized.canApply).toBe(true);
    const project = applyFloorplanToInterior(createEmptyInteriorProject({ id: "golden-kitchen" }), normalized);
    expect(project.walls.length).toBeGreaterThanOrEqual(4);
    expect(project.walls.every((wall) => wall.raised === true)).toBe(true);
    const wall = project.walls[0]!;
    const cabinet = {
      id: "cab-900",
      kind: "cabinet" as const,
      name: "Base 900",
      category: "cabinet",
      catalogItemId: "living:base-cabinet-900",
      roomId: project.activeRoomId,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { widthMm: 900, heightMm: 720, depthMm: 560 },
      materialSlots: {},
      parameters: {},
      extensions: {},
    };
    const placed = attachToWall(project, cabinet, wall.id);
    expect(placed.extensions?.wallAttachment).toEqual({ wallId: wall.id });
    expect(placed.position).not.toEqual(cabinet.position);
  });
});
