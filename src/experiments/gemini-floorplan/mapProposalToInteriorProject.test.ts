import { describe, expect, it } from "vitest";
import { mapProposalToInteriorProject, proposalPointToInterior } from "./mapProposalToInteriorProject";
import { SAMPLE_L_ROOM_CM, SAMPLE_RECT_KITCHEN_MM } from "./sampleProposals";
import { normalizeProposalToMm } from "./normalizeProposal";

describe("mapProposalToInteriorProject", () => {
  it("maps kitchen outline into rooms and walls", () => {
    const result = mapProposalToInteriorProject(SAMPLE_RECT_KITCHEN_MM, {
      projectId: "test-kitchen",
      now: "2026-09-05T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.rooms.length).toBe(1);
    expect(result.project.walls.length).toBe(4);
    expect(result.project.rooms[0].name).toBe("Kitchen");
    expect(result.project.walls[0].heightMm).toBe(2700);
    expect(result.project.extensions?.geminiFloorplanLab).toBeTruthy();
    expect(result.warnings.some((w) => /opening/i.test(w))).toBe(true);
  });

  it("maps L-room after normalize", () => {
    const result = mapProposalToInteriorProject(normalizeProposalToMm(SAMPLE_L_ROOM_CM), {
      projectId: "test-l",
      now: "2026-09-05T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.rooms.length).toBe(1);
    expect(result.project.walls.length).toBe(6);
  });

  it("rejects non-mm proposals", () => {
    const result = mapProposalToInteriorProject(SAMPLE_L_ROOM_CM);
    expect(result.ok).toBe(false);
  });

  it("converts plan Y to interior Z", () => {
    expect(proposalPointToInterior({ x: 10, y: 20 })).toEqual({ x: 10, z: 20 });
  });
});
