import { cleanProposalGeometry } from "./cleanProposalGeometry";
import { extractCvWallCandidates } from "./cvExtractWalls";
import type { GeminiFloorProposal } from "./proposalTypes";

export type ClassicalCvHybridResult = {
  proposal: GeminiFloorProposal;
  usedCv: boolean;
  reason?: string;
};

/**
 * CV geometry + Vision semantics (rooms, openings, notes, scale).
 * Fail soft → Phase 6A cleaned Vision walls.
 */
export function mergeCvWallsWithVision(
  vision: GeminiFloorProposal,
  cvWalls: GeminiFloorProposal["walls"],
): GeminiFloorProposal {
  const note = "Phase 6B classical CV: axis wall candidates from image; Vision labels kept.";
  const notes = [...(vision.notes ?? [])];
  if (!notes.includes(note)) notes.push(note);
  return cleanProposalGeometry({
    ...vision,
    walls: cvWalls,
    notes,
  });
}

export async function buildClassicalCvHybrid(
  vision: GeminiFloorProposal,
  imageFile: File | null,
): Promise<ClassicalCvHybridResult> {
  if (!imageFile) {
    return {
      proposal: cleanProposalGeometry(vision),
      usedCv: false,
      reason: "No plan image — fell back to Phase 6A cleanup.",
    };
  }
  const extracted = await extractCvWallCandidates(imageFile, vision);
  if (!extracted.ok) {
    const fallback = cleanProposalGeometry(vision);
    const note = `Phase 6B CV skipped: ${extracted.reason}`;
    const notes = [...(fallback.notes ?? [])];
    if (!notes.includes(note)) notes.push(note);
    return { proposal: { ...fallback, notes }, usedCv: false, reason: extracted.reason };
  }
  return {
    proposal: mergeCvWallsWithVision(vision, extracted.walls),
    usedCv: true,
  };
}
