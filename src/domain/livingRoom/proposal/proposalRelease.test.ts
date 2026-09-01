import { describe, expect, it } from "vitest";
import {
  appendFrozenQuote,
  buildLiveInteriorQuote,
  buildProposalDocument,
  buildProposalGate,
  collectProposalViewFrames,
  createFrozenGoldenProposalProject,
  createGoldenProposalProject,
  freezeLiveQuote,
  freezeProposal,
  goldenProposalViewFrame,
  patchProposalJob,
  patchProposalQuoteSettings,
  proposalExportCommit,
  readProposalCommercial,
  PROPOSAL_TEST_PNG,
} from ".";

const NOW = "2026-08-30T10:00:00.000Z";

describe("proposal release reviews", () => {
  it("blocks export when customer name or project number is blank", () => {
    const frozen = createFrozenGoldenProposalProject(NOW);
    const frame = goldenProposalViewFrame(frozen);
    const blank = patchProposalJob(frozen, { customerName: "  ", projectNumber: "" });
    const gate = buildProposalGate({
      document: blank,
      issues: [],
      now: NOW,
      viewFrames: [frame],
    });
    expect(gate.ready).toBe(false);
    expect(gate.items.some((item) => item.id === "identity")).toBe(true);
  });

  it("blocks export until a selected named view has a matching capture", () => {
    const frozen = createFrozenGoldenProposalProject(NOW);
    expect(buildProposalGate({ document: frozen, issues: [], now: NOW }).ready).toBe(false);
    expect(buildProposalGate({
      document: frozen,
      issues: [],
      now: NOW,
      viewFrames: [{
        cameraId: "other-camera",
        viewName: "Other",
        dataUrl: PROPOSAL_TEST_PNG,
        projectId: frozen.id,
      }],
    }).items.some((item) => item.id === "view-frames")).toBe(true);
    expect(buildProposalGate({
      document: frozen,
      issues: [],
      now: NOW,
      viewFrames: [goldenProposalViewFrame(frozen)],
    }).ready).toBe(true);
  });

  it("ignores renders from another project or an unselected camera", () => {
    const frozen = createFrozenGoldenProposalProject(NOW);
    const view = goldenProposalViewFrame(frozen);
    const frames = collectProposalViewFrames(frozen, {
      latestRender: {
        id: "r1",
        dataUrl: PROPOSAL_TEST_PNG,
        createdAt: NOW,
        projectId: "other-project",
        sceneFingerprint: "x",
        cameraId: view.cameraId,
        cameraName: view.viewName,
        quality: "draft",
        widthPx: 8,
        heightPx: 8,
        lightingRecipeId: "day",
        exposure: 1,
        transparentBackground: false,
        composition: "project-camera",
      },
    });
    expect(frames).toEqual([]);
  });

  it("keeps a client-safe summary without workshop, markup, or margin lines", () => {
    const proposal = buildProposalDocument(createFrozenGoldenProposalProject(NOW), { now: NOW });
    const labels = proposal.summaryLines.map((line) => line.label.toLowerCase());
    expect(labels).toContain("total");
    expect(labels.some((label) => /workshop|markup|cabinets and hardware|finish premium|labour/.test(label))).toBe(false);
    expect(proposal.summaryLines.some((line) => line.label === "Total" && line.amount === proposal.sellTotal)).toBe(true);
  });

  it("uses the frozen client payload after a stale override instead of live cabinet lines", () => {
    const frozen = freezeProposal(createGoldenProposalProject(NOW), NOW);
    expect(readProposalCommercial(frozen).surface.frozenClient?.snapshotId).toBe(
      buildLiveInteriorQuote(frozen, NOW).frozen?.id,
    );
    const atFreeze = buildProposalDocument(frozen, { now: NOW });
    const stale = patchProposalQuoteSettings(frozen, { markupPercent: 32 });
    const disclosed = buildProposalDocument(stale, { now: NOW, staleOverride: true });
    expect(disclosed.staleDisclosed).toBe(true);
    expect(disclosed.sellTotal).toBe(atFreeze.sellTotal);
    expect(disclosed.cabinets).toEqual(atFreeze.cabinets);
    expect(disclosed.cabinets.length).toBeGreaterThan(0);
  });

  it("omits cabinet itemization when a stale override has no frozen client payload", () => {
    const project = createGoldenProposalProject(NOW);
    const snapshot = freezeLiveQuote(project, NOW);
    const frozen = appendFrozenQuote(project, snapshot);
    expect(readProposalCommercial(frozen).surface.frozenClient).toBeNull();
    const stale = patchProposalQuoteSettings(frozen, { markupPercent: 32 });
    const disclosed = buildProposalDocument(stale, { now: NOW, staleOverride: true });
    expect(disclosed.staleDisclosed).toBe(true);
    expect(disclosed.cabinets).toEqual([]);
    expect(disclosed.sellTotal).toBe(snapshot.sellTotal);
  });

  it("records a stale override only after a successful save", () => {
    const frozen = freezeProposal(createGoldenProposalProject(NOW), NOW);
    const snapshot = buildLiveInteriorQuote(frozen, NOW).frozen;
    expect(proposalExportCommit({
      saved: false,
      staleOverride: true,
      frozen: snapshot,
    }).persistOverride).toBe(false);
    expect(proposalExportCommit({
      saved: true,
      staleOverride: true,
      frozen: snapshot,
      now: NOW,
    })).toEqual({
      persistOverride: true,
      override: {
        snapshotId: snapshot!.id,
        reason: "Salesperson disclosed stale quote on proposal.",
        overriddenAt: NOW,
      },
    });
  });
});
