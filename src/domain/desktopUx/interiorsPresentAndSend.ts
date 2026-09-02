export type InteriorsPresentStep =
  | "freeze"
  | "capture"
  | "proposal"
  | "approve"
  | "send"
  | "done";

export type InteriorsPresentGateItem = {
  id: string;
  detail: string;
  blocking?: boolean;
  status?: string;
};

export function isInteriorsPresentMode(plannerMode: string): boolean {
  return plannerMode === "render";
}

export function interiorsPresentAuthoringView(
  plannerMode: string,
  workspaceView: "plan" | "model" | "render",
): "plan" | "model" | "render" {
  if (isInteriorsPresentMode(plannerMode) || workspaceView === "render") return "plan";
  return workspaceView;
}

export function interiorsPresentHint(step: InteriorsPresentStep): string {
  if (step === "freeze") return "Review the live total, then freeze this revision";
  if (step === "capture") return "Capture the selected client view before creating the proposal";
  if (step === "proposal") return "Create the proposal PDF for this frozen revision";
  if (step === "approve") return "Record client approval against this revision";
  if (step === "send") return "Send the same cabinet identities to engineering";
  return "Quote frozen, approved, and sent";
}

export function interiorsPresentNeedsCapture(
  items: readonly InteriorsPresentGateItem[],
): boolean {
  return items.some((item) => (
    (item.id === "views" || item.id === "view-frames") && item.status === "fail"
  ));
}

export function interiorsPresentStep(input: {
  frozen: boolean;
  stale: boolean;
  needsCapture: boolean;
  proposalReleased: boolean;
  approved: boolean;
  handoffSent: boolean;
}): InteriorsPresentStep {
  if (!input.frozen || input.stale) return "freeze";
  if (input.needsCapture) return "capture";
  if (!input.proposalReleased) return "proposal";
  if (!input.approved) return "approve";
  if (!input.handoffSent) return "send";
  return "done";
}

export function interiorsPresentBlocking(
  step: InteriorsPresentStep,
  proposalItems: readonly InteriorsPresentGateItem[],
  handoffItems: readonly InteriorsPresentGateItem[],
): string[] {
  if (step === "freeze" || step === "done") return [];
  if (step === "capture") {
    return proposalItems
      .filter((item) => (item.id === "views" || item.id === "view-frames") && item.status === "fail")
      .map((item) => item.detail);
  }
  if (step === "proposal") {
    return proposalItems
      .filter((item) => item.blocking && item.status === "fail")
      .map((item) => item.detail);
  }
  if (step === "approve") {
    return handoffItems
      .filter((item) => item.blocking && item.id !== "approval" && item.id !== "already-sent")
      .map((item) => item.detail);
  }
  return handoffItems
    .filter((item) => item.blocking && item.id !== "already-sent")
    .map((item) => item.detail);
}

export function interiorsPresentCountLabel(input: {
  sellTotalLabel: string;
  revision: string;
  frozen: boolean;
}): string {
  return `${input.sellTotalLabel} · ${input.frozen ? `Frozen Rev ${input.revision}` : "Live estimate"}`;
}
