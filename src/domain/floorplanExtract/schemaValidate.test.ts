import { describe, expect, it, vi, beforeEach } from "vitest";
import { clearFloorplanSchemaCache, validateExtractionAgainstLiveSchema } from "./schemaValidate";

const minimal = {
  schema_version: "1.0",
  units: "meters",
  polygons: {
    rooms: [],
    walls: [{ outer: [[0, 0], [1, 0], [1, 0.2], [0, 0.2]] }],
    doors: [],
    windows: [],
  },
};

beforeEach(() => {
  clearFloorplanSchemaCache();
  vi.restoreAllMocks();
});

describe("validateExtractionAgainstLiveSchema", () => {
  it("accepts a draft when live schema matches", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        required: ["schema_version", "units", "polygons"],
        properties: {
          schema_version: { const: "1.0" },
          units: { enum: ["meters", "centimeters"] },
          source: { properties: { mode: { enum: ["vector", "stub", "raster2seq", "yytsi", "worker"] } } },
        },
      }),
    })));
    const out = await validateExtractionAgainstLiveSchema(minimal);
    expect(out.schema_version).toBe("1.0");
  });

  it("accepts contract source.mode=vector when live schema omitted it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        required: ["schema_version", "units", "polygons"],
        properties: {
          schema_version: { const: "1.0" },
          source: { properties: { mode: { enum: ["stub", "yytsi", "raster2seq"] } } },
        },
      }),
    })));
    const out = await validateExtractionAgainstLiveSchema({
      ...minimal,
      source: { mode: "vector" },
    });
    expect(out.source?.mode).toBe("vector");
  });

  it("rejects bad source.mode against live enum", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        required: ["schema_version", "units", "polygons"],
        properties: {
          schema_version: { const: "1.0" },
          units: { enum: ["meters", "centimeters"] },
          source: { properties: { mode: { enum: ["vector"] } } },
        },
      }),
    })));
    await expect(validateExtractionAgainstLiveSchema({
      ...minimal,
      source: { mode: "nope" },
    })).rejects.toThrow(/source\.mode/);
  });
});
