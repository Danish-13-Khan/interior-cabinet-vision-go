import { describe, expect, it } from "vitest";
import {
  appendFrozenQuote,
  buildProposalDocument,
  buildProposalGate,
  createFrozenGoldenProposalProject,
  createGoldenProposalProject,
  freezeLiveQuote,
  goldenProposalViewFrame,
  isProposalExportBlocked,
  proposalFileName,
  setProposalSelectedViews,
} from ".";

const NOW = "2026-08-30T10:00:00.000Z";

describe("proposal document and gate", () => {
  it("builds a branded proposal from the frozen quote", () => {
    const project = createFrozenGoldenProposalProject(NOW);
    const proposal = buildProposalDocument(project, { now: NOW });
    const liveFrozen = proposal.quoteSnapshotId;
    expect(proposal.brand).toBe("Cabinet Studio");
    expect(proposal.customerName).toBe("Rivera Residence");
    expect(proposal.projectNumber).toBe("JOB-317");
    expect(proposal.revision).toBe("A");
    expect(proposal.draft).toBe(false);
    expect(proposal.views.some((view) => view.viewName === "Hero perspective")).toBe(true);
    expect(proposal.inclusions.length).toBeGreaterThan(0);
    expect(proposal.exclusions.length).toBeGreaterThan(0);
    expect(proposal.fileName).toContain("job-317");
    expect(proposal.fileName).toContain("rev-a");
    expect(proposal.fileName).toContain("proposal");
    expect(proposal.quoteSnapshotId).toBe(liveFrozen);
    expect(proposal.summaryLines.some((line) => line.label === "Total")).toBe(true);
    expect(proposal.summaryLines.every((line) =>
      !/workshop|markup|cabinets and hardware/i.test(line.label)
    )).toBe(true);
  });

  it("blocks final proposal without freeze, views, or when stale", () => {
    const bare = createGoldenProposalProject(NOW);
    expect(isProposalExportBlocked({ document: bare, issues: [], now: NOW })).toBe(true);
    expect(buildProposalGate({ document: bare, issues: [], now: NOW }).items.find((item) => item.id === "freeze")?.status).toBe("fail");

    const frozen = createFrozenGoldenProposalProject(NOW);
    expect(buildProposalGate({
      document: frozen,
      issues: [],
      now: NOW,
      viewFrames: [goldenProposalViewFrame(frozen)],
    }).ready).toBe(true);

    const noViews = setProposalSelectedViews(createGoldenProposalProject(NOW), ["missing-camera"]);
    expect(buildProposalGate({ document: noViews, issues: [], now: NOW }).items.find((item) => item.id === "views")?.status).toBe("fail");
  });

  it("uses deterministic filesystem-safe names", () => {
    expect(proposalFileName({
      projectNumber: "JOB 317 / Rivera",
      revision: "B",
      quoteSnapshotId: "quote-1",
    })).toBe("job-317-rivera-rev-b-proposal-quote-1.pdf");
    expect(proposalFileName({
      projectName: "???",
      draft: true,
    })).toBe("draft-proposal-rev-a-proposal-draft.pdf");
  });

  it("requires re-freeze or an explicit stale override", () => {
    const project = createGoldenProposalProject(NOW);
    const frozen = appendFrozenQuote(project, freezeLiveQuote(project, NOW));
    const staleProject = {
      ...frozen,
      objects: frozen.objects.map((object, index) =>
        index === 0
          ? { ...object, dimensions: { ...object.dimensions, widthMm: object.dimensions.widthMm + 80 } }
          : object,
      ),
    };
    const gate = buildProposalGate({ document: staleProject, issues: [], now: NOW });
    expect(gate.ready).toBe(false);
    expect(gate.canOverrideStale).toBe(true);
    expect(buildProposalGate({
      document: staleProject,
      issues: [],
      now: NOW,
      staleOverride: true,
      overrideReason: "Client accepted the previous freeze.",
      viewFrames: [goldenProposalViewFrame(staleProject)],
    }).ready).toBe(true);
    expect(buildProposalGate({
      document: staleProject,
      issues: [],
      now: NOW,
      staleOverride: true,
      viewFrames: [goldenProposalViewFrame(staleProject)],
    }).ready).toBe(false);
    const disclosed = buildProposalDocument(staleProject, { now: NOW, staleOverride: true });
    expect(disclosed.staleDisclosed).toBe(true);
  });
});
