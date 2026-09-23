import { describe, expect, it } from "vitest";
import { quoteSnapshotClientAccepted, revisionHandoffRecords } from "./handoffRecords";

const base = {
  designRevision: "B",
  quoteSnapshotId: "snap-b" as string | null,
  projectId: "job-1",
  jobRevision: "B",
  jobStatus: "approved" as const,
  productionAt: undefined as string | undefined,
  engineeringSent: true,
  documents: [] as { projectId: string; revisionLabel: string; threadStatus: string }[],
};

describe("revision handoff records", () => {
  it("keeps client acceptance, engineering handoff, and production release apart", () => {
    const sent = revisionHandoffRecords(base);
    expect(sent).toEqual({
      clientAccepted: false,
      engineeringSent: true,
      productionReleased: false,
    });
    const accepted = revisionHandoffRecords({
      ...base,
      engineeringSent: false,
      documents: [{ id: "quote-b", projectId: "job-1", revisionLabel: "B", threadStatus: "accepted", quoteSnapshotId: "snap-b" }],
    });
    expect(accepted.clientAccepted).toBe(true);
    expect(accepted.engineeringSent).toBe(false);
    expect(accepted.productionReleased).toBe(false);
    const released = revisionHandoffRecords({
      ...base,
      jobStatus: "production",
      productionAt: "2026-09-23T00:00:00.000Z",
    });
    expect(released.productionReleased).toBe(true);
  });

  it("ignores acceptance and release that belong to another revision", () => {
    expect(quoteSnapshotClientAccepted(
      [{ id: "old", projectId: "job-1", revisionLabel: "B", threadStatus: "accepted", quoteSnapshotId: "snap-b-old" }],
      "job-1",
      "snap-b",
    )).toBe(false);
    expect(quoteSnapshotClientAccepted(
      [
        { id: "quote-b", projectId: "job-1", revisionLabel: "B", threadStatus: "accepted", quoteSnapshotId: "snap-b" },
        { id: "invoice-b", projectId: "job-1", revisionLabel: "B", threadStatus: "invoiced", quoteSnapshotId: "snap-b", kind: "invoice", supersedesDocumentId: "quote-b" },
      ],
      "job-1",
      "snap-b",
    )).toBe(true);
    expect(revisionHandoffRecords({
      ...base,
      designRevision: "C",
      jobStatus: "production",
      productionAt: "2026-09-23T00:00:00.000Z",
    }).productionReleased).toBe(false);
    expect(revisionHandoffRecords({ ...base, quoteSnapshotId: null }).clientAccepted).toBe(false);
  });
});
