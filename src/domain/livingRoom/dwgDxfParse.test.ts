import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAsciiDxf } from "./dwgDxfParse";
import { buildDwgPreview } from "./dwgGeometry";
import { dwgPlanDimensionsMm } from "./dwgUnits";

const room = readFileSync("tests/fixtures/dwg/room_4000x3000.dxf", "utf8");

describe("known-scale room drawing", () => {
  it("records millimetre units, supported wall layer, and drawn vs omitted entities", () => {
    const db = parseAsciiDxf(room);
    expect(db.header.INSUNITS).toBe(4);
    const preview = buildDwgPreview(db);
    expect(preview.mmPerUnit).toBe(1);
    expect(dwgPlanDimensionsMm(preview.bounds, preview.mmPerUnit!)).toEqual({
      widthMm: 4000,
      heightMm: 3000,
    });
    expect(preview.layers.map((layer) => layer.name).sort()).toEqual([
      "Cabinets",
      "Doors",
      "Walls",
      "Windows",
    ]);
    expect(preview.layers.find((layer) => layer.name === "Walls")?.paths).toHaveLength(6);
    expect(preview.rendered).toBe(13);
    expect(preview.omitted).toEqual({ TEXT: 1 });
    expect(preview.inserts).toEqual([
      { name: "BASE-CABINET", layer: "Cabinets", x: 200, y: 400, rotation: 0 },
    ]);
  });

  it("keeps LWPOLYLINE bulges so arcs are drawn", () => {
    const db = parseAsciiDxf(`  0
SECTION
  2
HEADER
  9
$INSUNITS
 70
     4
  0
ENDSEC
  0
SECTION
  2
ENTITIES
  0
LWPOLYLINE
  8
Walls
 90
     2
 10
0.0
 20
0.0
 42
1.0
 10
10.0
 20
0.0
  0
ENDSEC
  0
EOF
`);
    const poly = db.entities[0] as { type: string; vertices: { x: number; y: number; bulge: number }[] };
    expect(poly.vertices[0]).toMatchObject({ x: 0, y: 0, bulge: 1 });
    expect(poly.vertices[1]).toMatchObject({ x: 10, y: 0, bulge: 0 });
    const preview = buildDwgPreview(db);
    expect(preview.layers[0]?.paths[0]?.d).toMatch(/ A/);
    expect(preview.omitted).toEqual({});
  });

  it("rejects non-ASCII payloads", () => {
    expect(() => parseAsciiDxf("not a dxf")).toThrow(/ASCII drawing/);
  });
});
