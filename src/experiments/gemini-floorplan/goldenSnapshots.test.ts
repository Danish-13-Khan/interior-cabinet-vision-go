import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildRoomShell } from "./buildRoomShell";
import { mapProposalToInteriorProject } from "./mapProposalToInteriorProject";
import { normalizeProposalToMm } from "./normalizeProposal";
import { parseGeminiFloorProposal } from "./proposalSchema";
import { SAMPLE_RECT_KITCHEN_MM } from "./sampleProposals";

const goldenDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../experiments/gemini-floorplan/fixtures/golden",
);

function readGolden(name: string) {
  return JSON.parse(readFileSync(join(goldenDir, name), "utf8"));
}

describe("golden proposal snapshots", () => {
  it("matches rect-kitchen proposal golden", () => {
    const golden = readGolden("rect-kitchen.proposal.json");
    expect(normalizeProposalToMm(SAMPLE_RECT_KITCHEN_MM)).toEqual(golden);
    const parsed = parseGeminiFloorProposal(golden);
    expect(parsed.errors).toEqual([]);
    expect(parsed.proposal).toEqual(golden);
  });

  it("matches mapped + shell summary golden", () => {
    const summary = readGolden("rect-kitchen.summary.json");
    const mapped = mapProposalToInteriorProject(SAMPLE_RECT_KITCHEN_MM, {
      projectId: "golden-kitchen",
      now: "2026-09-05T00:00:00.000Z",
    });
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) return;
    expect(mapped.project.rooms).toHaveLength(summary.roomCount);
    expect(mapped.project.walls).toHaveLength(summary.wallCount);
    expect(mapped.project.rooms[0].name).toBe(summary.roomName);
    expect(mapped.project.walls[0].heightMm).toBe(summary.wallHeightMm);

    const shell = buildRoomShell(SAMPLE_RECT_KITCHEN_MM);
    expect(shell).not.toBeNull();
    if (!shell) return;
    const kinds = { floor: 0, wall: 0, opening: 0 };
    for (const box of shell.boxes) kinds[box.kind] += 1;
    expect(kinds).toEqual(summary.shellBoxKinds);
  });
});
