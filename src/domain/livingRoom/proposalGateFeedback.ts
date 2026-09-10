/** Display helpers for proposal gate rows in Review / Present (Step 7). */

import type { ProposalGateItem } from "./proposal/types";

export type ProposalGateFeedbackRow = {
  id: string;
  label: string;
  detail: string;
  severity: "error" | "warning" | "pass";
  blocking: boolean;
};

export function proposalGateFeedbackRows(
  items: readonly ProposalGateItem[],
): ProposalGateFeedbackRow[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    detail: item.detail,
    severity: item.status === "fail" ? "error" : item.status === "warn" ? "warning" : "pass",
    blocking: item.blocking && item.status === "fail",
  }));
}

export function proposalGateSeverityClass(row: ProposalGateFeedbackRow): string {
  if (row.severity === "error") return "is-error";
  if (row.severity === "warning") return "is-warning";
  return "is-pass";
}

export function proposalGateJourneyHint(input: {
  ready: boolean;
  blockingCount: number;
  frozen: boolean;
}): string {
  if (!input.frozen) {
    return "Freeze the quote, then open Present to capture views, create the proposal, approve, and send.";
  }
  if (input.blockingCount > 0) {
    return `${input.blockingCount} gate item${input.blockingCount === 1 ? "" : "s"} still block Create Proposal.`;
  }
  if (input.ready) {
    return "Proposal gates pass — open Present to finish capture, PDF, approval, and engineering send.";
  }
  return "Open Present to continue the client proposal journey.";
}
