import type { InteriorProject } from "../../interiorProject";
import { readProposalCommercial } from "../proposal/commercialState";
import { handoffApprovalReady } from "./handoffApprove";
import { hasHandoffSnapshotForRevision } from "./handoffState";
import { buildHandoffSummary } from "./handoffSummary";
import type { HandoffGate, HandoffGateItem } from "./types";

export function buildHandoffGate(
  document: InteriorProject,
  selectedInteriorObjectIds: string[] = [],
): HandoffGate {
  const summary = buildHandoffSummary(document, selectedInteriorObjectIds);
  const items: HandoffGateItem[] = [];
  const identified = summary.cabinets.filter((line) => line.cabinetType !== "unknown");
  if (identified.length === 0) {
    items.push({
      id: "cabinets",
      label: "Cabinets",
      detail: "Identify at least one cabinet before sending to Engineering.",
      blocking: true,
    });
  }
  if (summary.diagnostics.some((item) => item.blocking)) {
    items.push({
      id: "adapter",
      label: "Adapter diagnostics",
      detail: summary.diagnostics
        .filter((item) => item.blocking)
        .map((item) => item.message)
        .join(" "),
      blocking: true,
    });
  }
  if (summary.lossyGoldenIds.length) {
    const count = summary.lossyGoldenIds.length;
    items.push({
      id: "lossy-golden",
      label: "Golden cabinet mapping",
      detail: `${count} golden cabinet${count === 1 ? "" : "s"} would lose identity or configuration.`,
      blocking: true,
    });
  }
  if (summary.productionBlocked) {
    items.push({
      id: "production",
      label: "Production identity",
      detail: "Production report is blocked by cabinet identity issues.",
      blocking: true,
    });
  }
  const approval = handoffApprovalReady(document);
  if (!approval.ok && approval.reason) {
    items.push({
      id: approval.reason.startsWith("Freeze") || approval.reason.startsWith("Frozen")
        ? "freeze"
        : "approval",
      label: "Approved revision",
      detail: approval.reason,
      blocking: true,
    });
  }
  const revision = readProposalCommercial(document).job.revision;
  if (hasHandoffSnapshotForRevision(document, revision)) {
    items.push({
      id: "already-sent",
      label: "Handoff snapshot",
      detail: `Rev ${revision} was already sent to Engineering. Approve a new revision before sending again.`,
      blocking: true,
    });
  }
  const blockingCount = items.filter((item) => item.blocking).length;
  return {
    items,
    blockingCount,
    ready: blockingCount === 0,
    lossyGoldenCount: summary.lossyGoldenIds.length,
  };
}

export function isHandoffBlocked(document: InteriorProject): boolean {
  return !buildHandoffGate(document).ready;
}
