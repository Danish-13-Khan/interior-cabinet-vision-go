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
  overrideReason?: string;
  now?: string;
  viewFrames?: ProposalViewFrame[];
  acceptedStillCount?: number;
};

function row(
  id: string,
  label: string,
  status: ProposalGateItem["status"],
  detail: string,
  blocking = status === "fail",
): ProposalGateItem {
  return { id, label, detail, blocking, status };
}

export function buildProposalGate(input: ProposalGateInput): ProposalGate {
  const live = buildLiveInteriorQuote(input.document, input.now);
  const views = proposalExportViews(input.document);
  const missingFrames = missingProposalViewCaptures(input.document, input.viewFrames);
  const job = live.quote.job;
  const blockingIssues = input.issues.filter(isBlockingLivingRoomPlanIssue);
  const advisories = input.issues.filter((issue) => !isBlockingLivingRoomPlanIssue(issue));
  const millworkCount = input.document.objects.filter(isMillworkObject).length;
  const fallbackIds = activeRoomGeometryFallbackIds(input.document);
  const identityMissing = !job.customerName.trim() || !job.projectNumber.trim();
  const overrideOk = Boolean(
    input.staleOverride && live.frozen && live.stale && input.overrideReason?.trim(),
  );
  const staleStatus: ProposalGateItem["status"] = !live.frozen || !live.stale
    ? "pass"
    : overrideOk
      ? "warn"
      : "fail";
  const priceMissing = live.quote.cabinetLines.length === 0
    || !Number.isFinite(live.quote.sellTotal)
    || live.missingRate;
  const items: ProposalGateItem[] = [
    row("identity", "Client identity", identityMissing ? "fail" : "pass", identityMissing ? "Add customer name and project number before creating a proposal." : "Customer and project number are set"),
    row("layout", "Layout", blockingIssues.length ? "fail" : "pass", blockingIssues.length ? `${blockingIssues.length} blocking layout issue${blockingIssues.length === 1 ? "" : "s"}` : "No overlaps or out-of-room cabinets"),
    row("millwork", "Cabinets", millworkCount === 0 ? "fail" : "pass", millworkCount === 0 ? "Place at least one cabinet before creating a proposal." : `${millworkCount} cabinet piece${millworkCount === 1 ? "" : "s"}`),
    row("geometry", "Cabinet geometry", fallbackIds.length ? "fail" : "pass", fallbackIds.length ? "Fallback cabinet geometry cannot appear on a client proposal." : "Shared cabinet geometry compiled"),
    row("views", "Named views", views.length === 0 ? "fail" : "pass", views.length === 0 ? "Bookmark at least one client view for the proposal." : `${views.length} named view${views.length === 1 ? "" : "s"}`),
    row("view-frames", "Client views", views.length > 0 && missingFrames.length ? "fail" : "pass", missingFrames.length ? (missingFrames.length === views.length ? "Capture every selected client view before creating a proposal." : `Capture the remaining selected view${missingFrames.length === 1 ? "" : "s"} before creating a proposal.`) : "Selected client views are captured"),
    row("freeze", "Quote freeze", live.frozen ? "pass" : "fail", live.frozen ? `Frozen Rev ${live.frozen.revision}` : "Freeze the quote before creating a priced proposal."),
    row("stale", "Stale quote", staleStatus, staleStatus === "fail" ? (live.staleReason ?? "Re-freeze or disclose the stale quote with a reason.") : staleStatus === "warn" ? "Stale quote disclosed with an override reason." : "Frozen quote matches the live design"),
    row("price", "Price", priceMissing ? "fail" : "pass", live.quote.cabinetLines.length === 0 ? "Add a configured cabinet so the proposal has a price." : priceMissing ? "Quote total is missing or zero. Review commercial settings." : "Priced cabinets are ready"),
    row("layout-advisories", "Layout advisories", advisories.length ? "warn" : "pass", advisories.length ? `${advisories.length} clearance note${advisories.length === 1 ? "" : "s"}` : "No clearance advisories", false),
    row("accepted-stills", "Accepted stills", input.acceptedStillCount ? "pass" : "warn", input.acceptedStillCount ? `${input.acceptedStillCount} accepted for package` : "Optional · generate and accept a hybrid still", false),
  ];
  const blockingCount = items.filter((item) => item.blocking && item.status === "fail").length;
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
