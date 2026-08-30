import { describe, expect, it } from "vitest";
import { freezeProposal } from "../proposal/freezeProposal";
import { patchProposalJob } from "../proposal/commercialState";
import {
  approveEngineeringRevision,
  buildHandoffGate,
  commitEngineeringHandoff,
  readHandoffRecord,
  readHandoffSnapshots,
} from ".";
import { createApprovedHandoffProject } from "./handoff.testHelpers";

const NOW = "2026-08-30T12:00:00.000Z";

describe("engineering handoff approval and snapshots", () => {
  it("requires an approved revision and a matching freeze before send", () => {
    const approved = createApprovedHandoffProject(NOW);
    expect(buildHandoffGate(approved).ready).toBe(true);
    expect(approveEngineeringRevision(approved, NOW)).toBe(approved);
  });

  it("rejects a second send of the same approved revision", () => {
    const approved = createApprovedHandoffProject(NOW);
    const handed = commitEngineeringHandoff(approved, [], NOW);
    const first = readHandoffRecord(handed);
    expect(buildHandoffGate(handed).ready).toBe(false);
    expect(buildHandoffGate(handed).items.some((item) => item.id === "already-sent")).toBe(true);
    const resent = commitEngineeringHandoff(handed, [], "2026-08-31T12:00:00.000Z");
    expect(readHandoffSnapshots(resent)).toHaveLength(1);
    expect(readHandoffRecord(resent)?.handedOffAt).toBe(first?.handedOffAt);
    expect(readHandoffRecord(resent)?.fingerprint).toEqual(first?.fingerprint);
    expect(readHandoffRecord(resent)?.designFingerprint).toBe(first?.designFingerprint);
  });

  it("keeps the original snapshot when a newly approved revision is sent", () => {
    const first = commitEngineeringHandoff(createApprovedHandoffProject(NOW), [], NOW);
    const original = readHandoffRecord(first);
    const quoted = patchProposalJob(first, { revision: "B", status: "quoted" });
    const next = approveEngineeringRevision(freezeProposal(quoted, NOW), NOW);
    const second = commitEngineeringHandoff(next, [], "2026-08-31T09:00:00.000Z");
    const snapshots = readHandoffSnapshots(second);
    expect(snapshots.map((item) => item.revision).sort()).toEqual(["A", "B"]);
    expect(snapshots.find((item) => item.revision === "A")?.fingerprint).toEqual(original?.fingerprint);
    expect(readHandoffRecord(second)?.revision).toBe("B");
  });
});
