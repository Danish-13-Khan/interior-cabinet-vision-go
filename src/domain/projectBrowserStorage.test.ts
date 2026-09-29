import { describe, expect, it } from "vitest";
import { cabinetProjectFromInteriorProject } from "./interiorProject";
import { readProposalCommercial } from "./livingRoom/proposal";
import { createApprovedHandoffProject } from "./livingRoom/handoff/handoff.testHelpers";
import { patchProposalJob } from "./livingRoom/proposal/commercialState";
import {
  isStorageQuotaError,
  persistSavedProjects,
  readSavedProjects,
  upsertSavedProjectEntry,
  type SavedProjectBrowserEntry,
} from "./projectBrowserStorage";

const NOW = "2026-09-28T10:00:00.000Z";

function entry(
  id: string,
  document: ReturnType<typeof createApprovedHandoffProject>,
): SavedProjectBrowserEntry {
  const compatible = cabinetProjectFromInteriorProject(document);
  return {
    id,
    name: document.name,
    thumbnail: "",
    updatedAt: NOW,
    project: compatible.project,
    room: compatible.room,
  };
}

describe("project browser workflow persistence", () => {
  it("replaces the stale quoted copy when the same project is approved", () => {
    const approved = createApprovedHandoffProject(NOW);
    const quoted = patchProposalJob(approved, { status: "quoted" });
    const next = upsertSavedProjectEntry(
      [entry("saved-project", quoted)],
      entry("saved-project", approved),
    );

    expect(next).toHaveLength(1);
    expect(readProposalCommercial(next[0]!.project.interiorDocument!).job.status).toBe("approved");
  });

  it("round-trips the approved copy through browser storage", () => {
    const approvedEntry = entry("saved-project", createApprovedHandoffProject(NOW));
    let stored = "";
    const storage = {
      setItem: (_key: string, value: string) => { stored = value; },
      getItem: (_key: string) => stored,
    };
    storage.setItem("projects", JSON.stringify([approvedEntry]));

    const reopened = readSavedProjects(storage);
    expect(readProposalCommercial(reopened[0]!.project.interiorDocument!).job.status).toBe("approved");
  });
});

describe("persistSavedProjects", () => {
  const approvedEntry = () => entry("saved-project", createApprovedHandoffProject(NOW));

  it("reports quota errors instead of throwing", () => {
    const storage = {
      setItem: () => { throw new DOMException("Setting the value exceeded the quota.", "QuotaExceededError"); },
    };
    expect(() => persistSavedProjects([approvedEntry()], storage)).not.toThrow();
    expect(persistSavedProjects([approvedEntry()], storage)).toBe("quota-exceeded");
  });

  it("reports other storage failures and success", () => {
    const broken = { setItem: () => { throw new Error("SecurityError"); } };
    expect(persistSavedProjects([approvedEntry()], broken)).toBe("failed");
    expect(persistSavedProjects([approvedEntry()], { setItem: () => {} })).toBe("saved");
    expect(persistSavedProjects([approvedEntry()], null)).toBe("unavailable");
  });

  it("recognises quota errors across browsers", () => {
    expect(isStorageQuotaError(new DOMException("full", "QuotaExceededError"))).toBe(true);
    expect(isStorageQuotaError(Object.assign(new Error("full"), { name: "NS_ERROR_DOM_QUOTA_REACHED" }))).toBe(true);
    expect(isStorageQuotaError(new Error("other"))).toBe(false);
    expect(isStorageQuotaError("QuotaExceededError")).toBe(false);
  });
});
