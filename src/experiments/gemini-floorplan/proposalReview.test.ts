import { describe, expect, it } from "vitest";
import { proposalBounds, proposalViewBox, wallLengthMm } from "./proposalBounds";
import {
  updateRoomName,
  updateWallEndpoint,
  updateWallHeight,
} from "./proposalEdit";
import { SAMPLE_RECT_KITCHEN_MM } from "./sampleProposals";
import { applyUniformScaleMm, calibrateByWallLength } from "./scaleCalibration";

describe("proposalBounds", () => {
  it("covers the kitchen rectangle", () => {
    const b = proposalBounds(SAMPLE_RECT_KITCHEN_MM);
    expect(b?.minX).toBe(0);
    expect(b?.maxX).toBe(3600);
    expect(b?.maxY).toBe(3000);
    expect(proposalViewBox(SAMPLE_RECT_KITCHEN_MM)).toContain(" ");
  });

  it("measures wall length", () => {
    expect(wallLengthMm(SAMPLE_RECT_KITCHEN_MM.walls[0])).toBeCloseTo(3600);
  });
});

describe("proposalEdit", () => {
  it("updates room name, height, and wall endpoint", () => {
    let p = updateRoomName(SAMPLE_RECT_KITCHEN_MM, "kitchen", "Galley");
    expect(p.rooms[0].name).toBe("Galley");
    p = updateWallHeight(p, 2800);
    expect(p.assumedWallHeightMm).toBe(2800);
    p = updateWallEndpoint(p, "w1", "b", { x: 4000, y: 0 });
    expect(p.walls[0].b.x).toBe(4000);
  });
});

describe("scaleCalibration", () => {
  it("scales uniformly", () => {
    const scaled = applyUniformScaleMm(SAMPLE_RECT_KITCHEN_MM, 2);
    expect(scaled.walls[0].b.x).toBeCloseTo(7200);
  });

  it("calibrates by known wall length", () => {
    const result = calibrateByWallLength(SAMPLE_RECT_KITCHEN_MM, "w1", 1800);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.factor).toBeCloseTo(0.5);
    expect(wallLengthMm(result.proposal.walls[0])).toBeCloseTo(1800);
    expect(result.proposal.scaleConfidence).toBe("high");
  });

  it("rejects bad calibration input", () => {
    expect(calibrateByWallLength(SAMPLE_RECT_KITCHEN_MM, "missing", 1000).ok).toBe(false);
    expect(calibrateByWallLength(SAMPLE_RECT_KITCHEN_MM, "w1", 0).ok).toBe(false);
  });
});
