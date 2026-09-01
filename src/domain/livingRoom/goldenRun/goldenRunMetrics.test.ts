import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  INTERIOR_PROJECT_SCHEMA_VERSION,
  loadInteriorProjectFile,
} from "../../interiorProject";
import { freezeProposal } from "../proposal/freezeProposal";
import { buildProposalDocument } from "../proposal/proposalDocument";
import { buildProposalGate } from "../proposal/proposalGate";
import { PROPOSAL_TEST_PNG } from "../proposal/goldenProposal";
import { proposalExportViews, proposalSceneBinding } from "../proposal/proposalRevision";
import { inspectLivingRoomPlan } from "../planConstraints";
import { approveEngineeringRevision, buildHandoffGate } from "../handoff";
import { createGoldenCabinetRunProject } from "./createProject";
import { measureGoldenRun } from "./metrics";
import { reviseGoldenRunCabinetWidth } from "./revision";
import {
  loadGoldenRunFixture,
  readGoldenRunFixtureVersion,
  serializeGoldenRunFixture,
  goldenRunFixturePath,
} from "./serialize";
import {
  GOLDEN_CABINET_RUN_FIXTURE_VERSION,
  GOLDEN_RUN_JOB,
  GOLDEN_RUN_REVISED_WIDTH_MM,
} from "./types";

describe("golden cabinet run commercial and persistence metrics", () => {
  it("carries proposal metadata and stable engineering IDs after save/reopen", () => {
    const revised = reviseGoldenRunCabinetWidth(createGoldenCabinetRunProject());
    const frozen = freezeProposal(revised);
    const approved = approveEngineeringRevision(frozen);
    const live = measureGoldenRun(approved);
    const proposal = buildProposalDocument(approved);
    expect(proposal.customerName).toBe(GOLDEN_RUN_JOB.customerName);
    expect(proposal.projectNumber).toBe(GOLDEN_RUN_JOB.projectNumber);
    expect(proposal.revision).toBe(GOLDEN_RUN_JOB.revision);
    expect(proposal.fileName).toContain("gcr-001");
    expect(proposal.fileName).toContain("rev-a");
    expect(proposal.sellTotal).toBe(live.sellTotal);
    expect(live.engineeringIds.length).toBeGreaterThanOrEqual(6);
    const binding = proposalSceneBinding(approved);
    const frames = proposalExportViews(approved).map((view) => ({
      cameraId: view.cameraId,
      viewName: view.viewName,
      dataUrl: PROPOSAL_TEST_PNG,
      projectId: binding.projectId,
      sceneFingerprint: binding.sceneFingerprint,
      projectContentHash: binding.projectContentHash,
    }));
    expect(buildProposalGate({
      document: approved,
      issues: inspectLivingRoomPlan(approved),
      viewFrames: frames,
    }).ready).toBe(true);
    expect(buildHandoffGate(approved).ready).toBe(true);

    const reopened = loadGoldenRunFixture(serializeGoldenRunFixture(approved));
    const afterOpen = measureGoldenRun(reopened);
    expect(readGoldenRunFixtureVersion(reopened)).toBe(GOLDEN_CABINET_RUN_FIXTURE_VERSION);
    expect(afterOpen.revisedCabinetWidthMm).toBe(GOLDEN_RUN_REVISED_WIDTH_MM);
    expect(afterOpen.engineeringIds).toEqual(live.engineeringIds);
    expect(afterOpen.cabinetIds).toEqual(live.cabinetIds);
    expect(afterOpen.revision).toBe(live.revision);
    expect(afterOpen.sellTotal).toBe(live.sellTotal);
    expect(afterOpen.countertopId).toBe(live.countertopId);
    expect(afterOpen.countertopWidthMm).toBe(live.countertopWidthMm);
    expect(buildHandoffGate(reopened).ready).toBe(true);
  });

  it("keeps the committed fixture aligned with the factory and schema v2", () => {
    const expected = serializeGoldenRunFixture();
    const onDisk = readFileSync(goldenRunFixturePath(), "utf8");
    expect(onDisk).toBe(expected);
    const loaded = loadInteriorProjectFile(onDisk);
    expect(loaded.document.schemaVersion).toBe(INTERIOR_PROJECT_SCHEMA_VERSION);
    expect(readGoldenRunFixtureVersion(loaded.document)).toBe(GOLDEN_CABINET_RUN_FIXTURE_VERSION);
  });
});
