import { describe, expect, it } from "vitest";
import { patchProposalQuoteSettings } from "./commercialState";
import { freezeProposal } from "./freezeProposal";
import { createGoldenProposalProject } from "./goldenProposal";
import { matchingProposalRelease, recordProposalRelease } from "./proposalRelease";

const NOW = "2026-08-30T10:00:00.000Z";

describe("proposal release record", () => {
  it("does not match until a PDF save records the frozen snapshot", () => {
    const frozen = freezeProposal(createGoldenProposalProject(NOW), NOW);
    expect(matchingProposalRelease(frozen).ok).toBe(false);
    const released = recordProposalRelease(frozen, NOW);
    expect(matchingProposalRelease(released).ok).toBe(true);
    expect(released.extensions?.proposalSurface).toMatchObject({
      proposalRelease: { revision: "A", releasedAt: NOW },
    });
  });

  it("invalidates the release when the frozen snapshot changes", () => {
    const frozen = freezeProposal(createGoldenProposalProject(NOW), NOW);
    const released = recordProposalRelease(frozen, NOW);
    const stale = patchProposalQuoteSettings(released, { markupPercent: 32 });
    expect(matchingProposalRelease(stale).ok).toBe(true);
    const refrozen = freezeProposal(stale, "2026-08-31T10:00:00.000Z");
    expect(matchingProposalRelease(refrozen).ok).toBe(false);
    expect(matchingProposalRelease(recordProposalRelease(refrozen)).ok).toBe(true);
  });
});
