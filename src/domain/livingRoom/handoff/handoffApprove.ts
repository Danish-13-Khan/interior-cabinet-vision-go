import type { InteriorProject } from "../../interiorProject";
import { patchProposalJob, readProposalCommercial } from "../proposal/commercialState";
import { buildLiveInteriorQuote } from "../proposal/liveQuote";

export function handoffRevisionApproved(document: InteriorProject): boolean {
  const status = readProposalCommercial(document).job.status;
  return status === "approved" || status === "production";
}

export function matchingFrozenRevision(document: InteriorProject): {
  ok: boolean;
  reason: string | null;
} {
  const commercial = readProposalCommercial(document);
  const live = buildLiveInteriorQuote(document);
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

export function handoffApprovalReady(document: InteriorProject): {
  ok: boolean;
  reason: string | null;
} {
  if (!handoffRevisionApproved(document)) {
    return {
      ok: false,
      reason: "Approve the quoted revision before sending to Engineering.",
    };
  }
  return matchingFrozenRevision(document);
}

export function canApproveEngineeringRevision(document: InteriorProject): boolean {
  return !handoffRevisionApproved(document) && matchingFrozenRevision(document).ok;
}

export function approveEngineeringRevision(
  document: InteriorProject,
  _now = new Date().toISOString(),
): InteriorProject {
  if (handoffRevisionApproved(document)) return document;
  if (!matchingFrozenRevision(document).ok) return document;
  return patchProposalJob(document, { status: "approved" });
}
