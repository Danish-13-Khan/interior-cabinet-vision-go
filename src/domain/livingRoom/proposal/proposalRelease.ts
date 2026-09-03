import type { InteriorProject } from "../../interiorProject";
import { readProposalCommercial, writeProposalCommercial } from "./commercialState";
import { buildLiveInteriorQuote } from "./liveQuote";

export function matchingProposalRelease(document: InteriorProject): {
  ok: boolean;
  reason: string | null;
} {
  const live = buildLiveInteriorQuote(document);
  const commercial = readProposalCommercial(document);
  const release = commercial.surface.proposalRelease;
  if (!live.frozen) {
    return { ok: false, reason: "Freeze a quote before creating a proposal." };
  }
  if (!release) {
    return {
      ok: false,
      reason: "Create the proposal PDF for this frozen revision before recording approval.",
    };
  }
  if (release.revision !== commercial.job.revision || release.snapshotId !== live.frozen.id) {
    return { ok: false, reason: "Create a new proposal PDF for the current frozen revision." };
  }
  return { ok: true, reason: null };
}

export function recordProposalRelease(
  document: InteriorProject,
  now = new Date().toISOString(),
): InteriorProject {
  const live = buildLiveInteriorQuote(document);
  if (!live.frozen) return document;
  const commercial = readProposalCommercial(document);
  return writeProposalCommercial(document, {
    surface: {
      ...commercial.surface,
      proposalRelease: {
        releasedAt: now,
        revision: live.frozen.revision,
        snapshotId: live.frozen.id,
      },
    },
  });
}
