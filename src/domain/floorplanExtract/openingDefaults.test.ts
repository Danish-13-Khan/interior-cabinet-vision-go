import { describe, expect, it } from "vitest";
import { normalizeExtraction } from "./normalize";
import type { ExtractionResult } from "./types";

describe("opening height defaults", () => {
  it("does not treat missing height_m as zero at the gate", () => {
    const raw: ExtractionResult = {
      schema_version: "1.0",
      units: "meters",
      defaults: { wall_height_m: 2.7 },
      polygons: {
        rooms: [],
        walls: [{ id: "wall-0", outer: [[0, 0], [4, 0], [4, 0.2], [0, 0.2]] }],
        doors: [{
          id: "door-0",
          outer: [[1, 0], [2, 0], [2, 0.2], [1, 0.2]],
          opening: { swing: "left" },
        }],
        windows: [],
      },
    };
    const n = normalizeExtraction(raw, { acceptThinWalls: true });
    const att = n.openingAttachments["door-0"];
    expect(att.status).toBe("matched");
    // Missing height must not produce a blocking nonpositive height issue
    expect(n.issues.some((i) => i.entityId === "door-0" && i.message.includes("height_m must be > 0"))).toBe(false);
  });
});
