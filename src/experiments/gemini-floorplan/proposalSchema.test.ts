import { describe, expect, it } from "vitest";
import { normalizeProposalToMm } from "./normalizeProposal";
import { parseGeminiFloorProposal } from "./proposalSchema";
import { SAMPLE_RECT_KITCHEN_M, SAMPLE_RECT_KITCHEN_MM } from "./sampleProposals";

describe("parseGeminiFloorProposal", () => {
  it("accepts the offline kitchen fixture", () => {
    const { proposal, errors } = parseGeminiFloorProposal(SAMPLE_RECT_KITCHEN_MM);
    expect(errors).toEqual([]);
    expect(proposal?.rooms).toHaveLength(1);
    expect(proposal?.walls).toHaveLength(4);
  });

  it("rejects empty walls", () => {
    const { proposal, errors } = parseGeminiFloorProposal({
      ...SAMPLE_RECT_KITCHEN_MM,
      walls: [],
    });
    expect(proposal).toBeNull();
    expect(errors.some((e) => /walls/i.test(e))).toBe(true);
  });
});

describe("normalizeProposalToMm", () => {
  it("scales metres to millimetres", () => {
    const mm = normalizeProposalToMm(SAMPLE_RECT_KITCHEN_M);
    expect(mm.units).toBe("mm");
    expect(mm.rooms[0].outlineMm[1].x).toBeCloseTo(3600);
    expect(mm.walls[0].thicknessMm).toBeCloseTo(100);
    expect(mm.assumedWallHeightMm).toBeCloseTo(2700);
  });
});
