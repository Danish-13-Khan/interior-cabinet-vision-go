import { describe, expect, it } from "vitest";
import type { ProposalGateItem } from "./proposal/types";
import {
  proposalGateFeedbackRows,
  proposalGateJourneyHint,
  proposalGateSeverityClass,
} from "./proposalGateFeedback";

const items: ProposalGateItem[] = [
  { id: "identity", label: "Client identity", detail: "Add customer", blocking: true, status: "fail" },
  { id: "layout-advisories", label: "Layout advisories", detail: "1 note", blocking: false, status: "warn" },
  { id: "millwork", label: "Cabinets", detail: "2 pieces", blocking: true, status: "pass" },
];

describe("proposalGateFeedback", () => {
  it("maps gate statuses to review rows without changing gate math", () => {
    const rows = proposalGateFeedbackRows(items);
    expect(rows[0]).toMatchObject({ id: "identity", severity: "error", blocking: true });
    expect(rows[1]).toMatchObject({ severity: "warning", blocking: false });
    expect(rows[2]).toMatchObject({ severity: "pass", blocking: false });
    expect(proposalGateSeverityClass(rows[0]!)).toBe("is-error");
    expect(proposalGateSeverityClass(rows[1]!)).toBe("is-warning");
    expect(proposalGateSeverityClass(rows[2]!)).toBe("is-pass");
  });

  it("describes the next Present journey action", () => {
    expect(proposalGateJourneyHint({ ready: false, blockingCount: 2, frozen: false }))
      .toContain("Freeze the quote");
    expect(proposalGateJourneyHint({ ready: false, blockingCount: 2, frozen: true }))
      .toContain("2 gate items");
    expect(proposalGateJourneyHint({ ready: true, blockingCount: 0, frozen: true }))
      .toContain("Proposal gates pass");
  });
});
