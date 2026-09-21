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

  it("rejects non-ASCII payloads", () => {
    expect(() => parseAsciiDxf("not a dxf")).toThrow(/ASCII drawing/);
  });
});
