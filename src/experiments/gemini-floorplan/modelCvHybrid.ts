import { adaptModelOutputToProposal } from "./adaptModelToProposal";
import { buildClassicalCvHybrid } from "./classicalCvHybrid";
import { cleanProposalGeometry } from "./cleanProposalGeometry";
import type { FloorplanModelOutput } from "./floorplanModelTypes";
import type { GeminiFloorProposal } from "./proposalTypes";

export type ModelCvHybridResult = {
  proposal: GeminiFloorProposal;
  usedModel: boolean;
  reason?: string;
};

export function modelFixtureStem(fileName: string | null): string {
  if (!fileName) return "rect-kitchen";
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/-vision$/i, "")
    .replace(/-page\d+$/i, "");
}

export async function fetchModelFixture(stem: string): Promise<FloorplanModelOutput | null> {
  const url = `/experiments/gemini-floorplan/fixtures/cubicasa/${stem}.model.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as FloorplanModelOutput;
  } catch {
    return null;
  }
}

/**
 * Prefer CubiCasa-class model JSON → adapt → 6A clean.
 * Fail soft → 6B classical CV (if image) → else 6A.
 */
export async function buildModelCvHybrid(
  vision: GeminiFloorProposal,
  fileName: string | null,
  imageFile: File | null,
): Promise<ModelCvHybridResult> {
  const stem = modelFixtureStem(fileName);
  const model = await fetchModelFixture(stem);
  if (model && model.polygons?.length) {
    const adapted = adaptModelOutputToProposal(model, vision);
    return {
      proposal: cleanProposalGeometry(adapted),
      usedModel: true,
      reason: `Loaded model fixture ${stem}.model.json`,
    };
  }

  const cv = await buildClassicalCvHybrid(vision, imageFile);
  const note =
    `Phase 6C: no model JSON for “${stem}” — fell back to ${cv.usedCv ? "6B classical CV" : "6A cleanup"}.`;
  const notes = [...(cv.proposal.notes ?? [])];
  if (!notes.includes(note)) notes.push(note);
  return {
    proposal: { ...cv.proposal, notes },
    usedModel: false,
    reason: note,
  };
}
