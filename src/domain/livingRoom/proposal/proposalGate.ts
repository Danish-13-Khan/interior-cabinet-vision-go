import type { InteriorProject } from "../../interiorProject";
import type { LivingRoomPlanIssue } from "../planConstraints";
import { isBlockingLivingRoomPlanIssue } from "../planConstraints";
import { activeRoomGeometryFallbackIds } from "../cabinetSceneFallbacks";
import { isMillworkObject } from "../stillJob/sceneRefs";
import { buildLiveInteriorQuote } from "./liveQuote";
import { missingProposalViewCaptures } from "./proposalViewFrames";
import { proposalExportViews } from "./proposalRevision";
import type { ProposalGate, ProposalGateItem, ProposalViewFrame } from "./types";

export type ProposalGateInput = {
  document: InteriorProject;
  issues: LivingRoomPlanIssue[];
  staleOverride?: boolean;
  now?: string;
  viewFrames?: ProposalViewFrame[];
};

export function buildProposalGate(input: ProposalGateInput): ProposalGate {
  const live = buildLiveInteriorQuote(input.document, input.now);
  const views = proposalExportViews(input.document);
  const missingFrames = missingProposalViewCaptures(input.document, input.viewFrames);
  const job = live.quote.job;
  const blockingIssues = input.issues.filter(isBlockingLivingRoomPlanIssue);
  const millworkCount = input.document.objects.filter(isMillworkObject).length;
  const fallbackIds = activeRoomGeometryFallbackIds(input.document);
  const overrideOk = Boolean(input.staleOverride && live.frozen && live.stale);
  const items: ProposalGateItem[] = [];
  if (!job.customerName.trim() || !job.projectNumber.trim()) {
    items.push({
      id: "identity",
      label: "Client identity",
      detail: "Add customer name and project number before creating a proposal.",
      blocking: true,
    });
  }

  if (blockingIssues.length) {
    items.push({
      id: "layout",
      label: "Layout",
      detail: `${blockingIssues.length} blocking layout issue${blockingIssues.length === 1 ? "" : "s"}`,
      blocking: true,
    });
  }
  if (millworkCount === 0) {
    items.push({
      id: "millwork",
      label: "Cabinets",
      detail: "Place at least one cabinet before creating a proposal.",
      blocking: true,
    });
  }
  if (fallbackIds.length) {
    items.push({
      id: "geometry",
      label: "Cabinet geometry",
      detail: "Fallback cabinet geometry cannot appear on a client proposal.",
      blocking: true,
    });
  }
  if (views.length === 0) {
    items.push({
      id: "views",
      label: "Named views",
      detail: "Bookmark at least one client view for the proposal.",
      blocking: true,
    });
  } else if (missingFrames.length) {
    items.push({
      id: "view-frames",
      label: "Client views",
      detail: missingFrames.length === views.length
        ? "Capture every selected client view before creating a proposal."
        : `Capture the remaining selected view${missingFrames.length === 1 ? "" : "s"} before creating a proposal.`,
      blocking: true,
    });
  }
  if (!live.frozen) {
    items.push({
      id: "freeze",
      label: "Quote freeze",
      detail: "Freeze the quote before creating a priced proposal.",
      blocking: true,
    });
  } else if (live.stale && !overrideOk) {
    items.push({
      id: "stale",
      label: "Stale quote",
      detail: live.staleReason ?? "Re-freeze or disclose the stale quote.",
      blocking: true,
    });
  }
  if (live.quote.cabinetLines.length === 0) {
    items.push({
      id: "priced-cabinets",
      label: "Priced cabinets",
      detail: "Add a configured cabinet so the proposal has a price.",
      blocking: true,
    });
  } else if (!Number.isFinite(live.quote.sellTotal) || live.missingRate) {
    items.push({
      id: "price",
      label: "Price",
      detail: "Quote total is missing or zero. Review commercial settings.",
      blocking: true,
    });
  }

  const blockingCount = items.filter((item) => item.blocking).length;
  return {
    items,
    blockingCount,
    ready: blockingCount === 0,
    canOverrideStale: Boolean(live.frozen && live.stale),
  };
}

export function isProposalExportBlocked(input: ProposalGateInput): boolean {
  return !buildProposalGate(input).ready;
}
