import { describe, expect, it } from "vitest";
import { stillJobProjectContentHash } from "../stillJob/projectHash";
import {
  buildLiveInteriorQuote,
  buildProposalDocument,
  buildProposalGate,
  collectProposalViewFrames,
  createGoldenProposalProject,
  freezeProposal,
  goldenProposalViewFrame,
  goldenProposalViewFrames,
  patchProposalJob,
  patchProposalQuoteSettings,
  proposalExportViews,
  proposalSceneBinding,
  setProposalSelectedViews,
} from ".";
import {
  acceptedStill,
  BIND_NOW,
  moveFirstCabinet,
  renderFor,
  withSecondView,
} from "./proposalViewBind.testHelpers";

describe("proposal view binding", () => {
  it("rejects a capture after the design is changed and re-frozen", () => {
    const frozen = freezeProposal(createGoldenProposalProject(BIND_NOW), BIND_NOW);
    const staleFrame = goldenProposalViewFrame(frozen);
    const refrozen = freezeProposal(moveFirstCabinet(frozen, 400), BIND_NOW);
    expect(buildProposalGate({
      document: refrozen,
      issues: [],
      now: BIND_NOW,
      viewFrames: [staleFrame],
    }).items.find((item) => item.id === "view-frames")?.status).toBe("fail");
    expect(buildProposalGate({
      document: refrozen,
      issues: [],
      now: BIND_NOW,
      viewFrames: [goldenProposalViewFrame(refrozen)],
    }).ready).toBe(true);
  });

  it("accepts post-freeze stills when the visual scene still matches", () => {
    const frozen = freezeProposal(createGoldenProposalProject(BIND_NOW), BIND_NOW);
    const view = proposalExportViews(frozen)[0]!;
    const binding = proposalSceneBinding(frozen);
    const postFreezeHash = stillJobProjectContentHash(frozen);
    expect(postFreezeHash).not.toBe(binding.projectContentHash);
    expect(collectProposalViewFrames(frozen, {
      acceptedStills: [acceptedStill(frozen, view.cameraId, "sj-proj-old")],
    })).toEqual([]);
    expect(collectProposalViewFrames(frozen, {
      acceptedStills: [acceptedStill(frozen, view.cameraId, binding.projectContentHash)],
    })).toHaveLength(1);
    expect(collectProposalViewFrames(frozen, {
      acceptedStills: [acceptedStill(frozen, view.cameraId, postFreezeHash)],
    })).toHaveLength(1);
    const moved = moveFirstCabinet(frozen, 250);
    expect(collectProposalViewFrames(moved, {
      acceptedStills: [acceptedStill(moved, view.cameraId, stillJobProjectContentHash(moved))],
    })).toEqual([]);
  });

  it("requires a matching capture for every selected proposal view", () => {
    const frozen = freezeProposal(withSecondView(createGoldenProposalProject(BIND_NOW)), BIND_NOW);
    const frames = goldenProposalViewFrames(frozen);
    expect(frames.length).toBe(2);
    expect(buildProposalGate({
      document: frozen,
      issues: [],
      now: BIND_NOW,
      viewFrames: frames.slice(0, 1),
    }).items.find((item) => item.id === "view-frames")?.status).toBe("fail");
    expect(buildProposalGate({
      document: frozen,
      issues: [],
      now: BIND_NOW,
      viewFrames: frames,
    }).ready).toBe(true);
  });

  it("validates frames against the frozen view set after a stale view change", () => {
    const frozen = freezeProposal(withSecondView(createGoldenProposalProject(BIND_NOW)), BIND_NOW);
    const frozenViews = proposalExportViews(frozen);
    const switched = setProposalSelectedViews(frozen, [frozenViews[1]!.cameraId]);
    expect(buildLiveInteriorQuote(switched, BIND_NOW).stale).toBe(true);
    const liveOnly = collectProposalViewFrames(switched, {
      latestRender: renderFor(
        switched,
        frozenViews[1]!.cameraId,
        proposalSceneBinding(switched).sceneFingerprint,
      ),
    });
    expect(liveOnly.map((frame) => frame.cameraId)).toEqual([frozenViews[1]!.cameraId]);
    expect(buildProposalDocument(switched, { now: BIND_NOW, staleOverride: true }).views.map((view) => view.cameraId))
      .toEqual(frozenViews.map((view) => view.cameraId));
    expect(buildProposalGate({
      document: switched,
      issues: [],
      now: BIND_NOW,
      staleOverride: true,
      overrideReason: "Client accepted the previous freeze.",
      viewFrames: liveOnly,
    }).ready).toBe(false);
    expect(buildProposalGate({
      document: switched,
      issues: [],
      now: BIND_NOW,
      staleOverride: true,
      overrideReason: "Client accepted the previous freeze.",
      viewFrames: goldenProposalViewFrames(switched),
    }).ready).toBe(true);
  });

  it("marks the quote stale when client identity or validity changes", () => {
    const frozen = freezeProposal(createGoldenProposalProject(BIND_NOW), BIND_NOW);
    const renamed = patchProposalJob(frozen, { customerName: "Chen Residence" });
    const live = buildLiveInteriorQuote(renamed, BIND_NOW);
    expect(live.stale).toBe(true);
    expect(buildProposalDocument(renamed, { now: BIND_NOW }).customerName).toBe("Rivera Residence");
    expect(buildLiveInteriorQuote(
      patchProposalQuoteSettings(frozen, { validityDays: 7 }),
      BIND_NOW,
    ).stale).toBe(true);
  });
});
