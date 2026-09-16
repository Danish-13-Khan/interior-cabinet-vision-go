import { describe, expect, it, vi, beforeEach } from "vitest";
import { clearFloorplanSchemaCache } from "./schemaValidate";
import { ingestExtractionJson } from "./client";

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

describe("ingestExtractionJson", () => {
  it("marks structural-fallback when schema endpoint is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    const ingest = await ingestExtractionJson(minimal);
    expect(ingest.liveSchema.state).toBe("structural-fallback");
    expect(ingest.draft.units).toBe("meters");
  });

  it("marks live-ok when schema validates", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        required: ["schema_version", "units", "polygons"],
        properties: {
          schema_version: { const: "1.0" },
          units: { enum: ["meters", "centimeters"] },
        },
      }),
    })));
    const ingest = await ingestExtractionJson(minimal);
    expect(ingest.liveSchema.state).toBe("live-ok");
  });
});
