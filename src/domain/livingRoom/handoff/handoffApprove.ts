import type { InteriorProject } from "../../interiorProject";
import { patchProposalJob, readProposalCommercial } from "../proposal/commercialState";
import { matchingProposalRelease } from "../proposal/proposalRelease";
import { buildLiveInteriorQuote } from "../proposal/liveQuote";
import type { LiveQuoteOptions } from "../proposal/liveQuoteOptions";

export function handoffRevisionApproved(document: InteriorProject): boolean {
  const status = readProposalCommercial(document).job.status;
  return status === "approved" || status === "production";
}

export function matchingFrozenRevision(
  document: InteriorProject,
  options: LiveQuoteOptions = {},
): { ok: boolean; reason: string | null } {
  const commercial = readProposalCommercial(document);
  const live = buildLiveInteriorQuote(document, undefined, options);
  if (!live.frozen) {
    return {
      ok: false,
      reason: "Freeze a quote for this revision before sending to Engineering.",
    };
  }
  if (live.frozen.revision !== commercial.job.revision || live.stale) {
    return {
      ok: false,
      reason: "Frozen quote must match the live approved revision.",
    };
  }
  return { ok: true, reason: null };
}

export function handoffApprovalReady(
  document: InteriorProject,
  options: LiveQuoteOptions = {},
): { ok: boolean; reason: string | null } {
  if (!handoffRevisionApproved(document)) {
    return {
      ok: false,
      reason: "Approve the quoted revision before sending to Engineering.",
    };
  }
  return matchingFrozenRevision(document, options);
}

export function canApproveEngineeringRevision(
  document: InteriorProject,
  options: LiveQuoteOptions = {},
): boolean {
  return !handoffRevisionApproved(document)
    && matchingFrozenRevision(document, options).ok
    && matchingProposalRelease(document, options).ok;
}

export function approveEngineeringRevision(
  document: InteriorProject,
  _now = new Date().toISOString(),
  options: LiveQuoteOptions = {},
): InteriorProject {
  if (handoffRevisionApproved(document)) return document;
  if (!matchingFrozenRevision(document, options).ok) return document;
  if (!matchingProposalRelease(document, options).ok) return document;
  return patchProposalJob(document, { status: "approved" });
}
