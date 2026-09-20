import { describe, expect, it } from "vitest";
import {
  markScaleCalibrated,
  parseExtractScale,
  resolveScaleTrust,
  scaleTrustAllowsApply,
  stampImportWallsScale,
} from "./scaleTrust";
import type { ExtractionResult } from "./types";

function draft(scale?: ExtractionResult["scale"]): ExtractionResult {
  return {
    schema_version: "1.0",
    units: "meters",
    pixel_scale: 0.001,
    polygons: { rooms: [], walls: [], doors: [], windows: [] },
    scale,
  };
}

describe("scaleTrust", () => {
  it("does not treat pixel_scale 0.001 as calibrated", () => {
    const trust = resolveScaleTrust(draft());
    expect(trust.status).toBe("unknown");
    expect(scaleTrustAllowsApply(trust)).toBe(false);
  });

  it("stamps assumed when DXF sent a silent 0.001 hint", () => {
    const stamped = stampImportWallsScale(draft(), true);
    expect(stamped.scale).toEqual({ status: "assumed", source: "dxf_insunits" });
    expect(scaleTrustAllowsApply(resolveScaleTrust(stamped))).toBe(false);
  });

  it("stamps unknown when no assumed pixel_scale was sent", () => {
    expect(stampImportWallsScale(draft(), false).scale?.status).toBe("unknown");
  });

  it("overwrites a sidecar calibrated stamp on a fresh import", () => {
    const existing = draft({ status: "calibrated", source: "sidecar" });
    expect(stampImportWallsScale(existing, true).scale).toEqual({
      status: "assumed",
      source: "dxf_insunits",
    });
    expect(stampImportWallsScale(existing, false).scale?.status).toBe("unknown");
  });

  it("does not stamp when a saved user-calibrated draft is reopened", () => {
    const saved = draft({ status: "calibrated", source: "user_reference", referenceLengthMm: 8000 });
    expect(scaleTrustAllowsApply(resolveScaleTrust(saved))).toBe(true);
  });

  it("allows Apply only after a measured calibration", () => {
    const next = markScaleCalibrated(draft({ status: "assumed", source: "dxf_insunits" }), {
      referenceLengthMm: 8000,
    });
    expect(next.scale).toMatchObject({
      status: "calibrated",
      source: "user_reference",
      referenceLengthMm: 8000,
    });
    expect(scaleTrustAllowsApply(resolveScaleTrust(next))).toBe(true);
  });

  it("parses additive scale and rejects unknown status", () => {
    expect(parseExtractScale({ status: "assumed", source: "dxf_insunits" })).toEqual({
      status: "assumed",
      source: "dxf_insunits",
    });
    expect(() => parseExtractScale({ status: "trusted" })).toThrow(/scale.status/);
  });
});
